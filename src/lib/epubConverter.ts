
import mammoth from 'mammoth';
import JSZip from 'jszip';

interface Chapter {
  title: string;
  content: string;
  id: string;
}

export async function convertDocxToEpub(docxFile: File, coverImage?: File | null): Promise<ArrayBuffer> {
  console.log('Încep conversia DOCX către EPUB...');
  
  try {
    // Convertește DOCX în HTML folosind mammoth
    const arrayBuffer = await docxFile.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const htmlContent = result.value;
    const messages = result.messages;
    
    console.log('HTML extras din DOCX:', htmlContent.length, 'caractere');
    if (messages.length > 0) {
      console.log('Mesaje mammoth:', messages);
    }

    // Extrage capitolele bazate pe headings
    const chapters = extractChapters(htmlContent);
    console.log('Capitole extrase:', chapters.length);

    // Creează conținutul EPUB
    const epubContent = await createEpubContent(chapters, docxFile.name, coverImage);
    
    return epubContent;
  } catch (error) {
    console.error('Eroare în conversia DOCX:', error);
    throw new Error(`Eroare la conversia fișierului: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`);
  }
}

function extractChapters(htmlContent: string): Chapter[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const chapters: Chapter[] = [];
  const headings = doc.querySelectorAll('h1, h2, h3');
  
  if (headings.length === 0) {
    // Dacă nu există headings, creează un singur capitol cu tot conținutul
    chapters.push({
      title: 'Capitol 1',
      content: htmlContent,
      id: 'chapter-1'
    });
    return chapters;
  }

  headings.forEach((heading, index) => {
    const chapterTitle = heading.textContent?.trim() || `Capitol ${index + 1}`;
    const chapterId = `chapter-${index + 1}`;
    
    // Găsește conținutul dintre acest heading și următorul
    let content = '';
    let currentElement = heading.nextElementSibling;
    const nextHeading = headings[index + 1];
    
    while (currentElement && currentElement !== nextHeading) {
      content += currentElement.outerHTML || '';
      currentElement = currentElement.nextElementSibling;
    }
    
    // Includem și heading-ul în conținut
    content = heading.outerHTML + content;
    
    chapters.push({
      title: chapterTitle,
      content: content || '<p>Conținut gol</p>',
      id: chapterId
    });
  });

  return chapters;
}

async function createEpubContent(chapters: Chapter[], fileName: string, coverImage?: File | null): Promise<ArrayBuffer> {
  console.log('Creez structura EPUB...');
  
  const bookTitle = fileName.replace('.docx', '');
  const author = 'Necunoscut';
  
  // Creează un nou ZIP
  const zip = new JSZip();
  
  // mimetype (trebuie să fie primul fișier, necomprimat)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  
  // META-INF/container.xml
  zip.folder('META-INF')?.file('container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  // Creează folderul OEBPS
  const oebps = zip.folder('OEBPS');
  if (!oebps) throw new Error('Nu s-a putut crea folderul OEBPS');

  // OEBPS/content.opf
  let manifest = '';
  let spine = '';
  
  // Adaugă coperta dacă există
  if (coverImage) {
    const coverBuffer = await coverImage.arrayBuffer();
    const coverExt = coverImage.name.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = coverExt === 'png' ? 'image/png' : 'image/jpeg';
    
    const imagesFolder = oebps.folder('images');
    imagesFolder?.file(`cover.${coverExt}`, coverBuffer);
    
    manifest += `    <item id="cover-image" href="images/cover.${coverExt}" media-type="${mimeType}"/>\n`;
    manifest += `    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>\n`;
    spine += `    <itemref idref="cover"/>\n`;
    
    // Creează pagina de copertă
    oebps.file('cover.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Copertă</title>
  <style>
    body { margin: 0; padding: 0; text-align: center; }
    img { max-width: 100%; max-height: 100vh; }
  </style>
</head>
<body>
  <img src="images/cover.${coverExt}" alt="Copertă"/>
</body>
</html>`);
  }
  
  // Adaugă cuprinsul
  manifest += `    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml"/>\n`;
  spine += `    <itemref idref="toc"/>\n`;
  
  // Adaugă capitolele
  chapters.forEach((chapter) => {
    manifest += `    <item id="${chapter.id}" href="${chapter.id}.xhtml" media-type="application/xhtml+xml"/>\n`;
    spine += `    <itemref idref="${chapter.id}"/>\n`;
  });
  
  oebps.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${Date.now()}</dc:identifier>
    <dc:title>${bookTitle}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:language>ro</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${manifest}  </manifest>
  <spine toc="ncx">
${spine}  </spine>
</package>`);

  // Creează cuprinsul (toc.xhtml)
  let tocContent = '';
  chapters.forEach((chapter) => {
    tocContent += `    <li><a href="${chapter.id}.xhtml">${chapter.title}</a></li>\n`;
  });
  
  oebps.file('toc.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Cuprins</title>
  <style>
    body { font-family: serif; margin: 2em; }
    h1 { text-align: center; }
    ul { list-style-type: none; }
    li { margin: 0.5em 0; }
    a { text-decoration: none; color: #000; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Cuprins</h1>
  <ul>
${tocContent}  </ul>
</body>
</html>`);

  // Creează toc.ncx
  let ncxContent = '';
  chapters.forEach((chapter, index) => {
    ncxContent += `    <navPoint id="${chapter.id}" playOrder="${index + 2}">
      <navLabel><text>${chapter.title}</text></navLabel>
      <content src="${chapter.id}.xhtml"/>
    </navPoint>\n`;
  });
  
  oebps.file('toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${bookTitle}</text></docTitle>
  <navMap>
${ncxContent}  </navMap>
</ncx>`);

  // Creează fișierele capitolelor
  chapters.forEach((chapter) => {
    oebps.file(`${chapter.id}.xhtml`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
  <style>
    body { font-family: serif; margin: 2em; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
    p { margin: 1em 0; }
  </style>
</head>
<body>
  ${chapter.content}
</body>
</html>`);
  });

  // Generează fișierul ZIP
  console.log('Generez fișierul EPUB final...');
  const zipBuffer = await zip.generateAsync({ 
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
  
  console.log('EPUB creat cu succes, dimensiune:', zipBuffer.byteLength, 'bytes');
  
  return zipBuffer;
}
