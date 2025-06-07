
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
  
  // Căutăm toate elementele care conțin "Capitolul" sau sunt headings
  const allElements = doc.querySelectorAll('*');
  const chapterElements: Element[] = [];
  
  allElements.forEach(element => {
    const text = element.textContent?.trim() || '';
    // Detectează "Capitolul" urmat de număr
    if (text.match(/^Capitolul\s+\d+/i) || 
        text.match(/^Capitol\s+\d+/i) ||
        (element.tagName.match(/^H[1-6]$/) && text.length > 0)) {
      chapterElements.push(element);
    }
  });
  
  console.log('Elemente capitole găsite:', chapterElements.length);
  
  if (chapterElements.length === 0) {
    // Dacă nu găsim capitole, încercăm să împărțim după paragrafe care încep cu "Capitolul"
    const paragraphs = doc.querySelectorAll('p');
    paragraphs.forEach(p => {
      const text = p.textContent?.trim() || '';
      if (text.match(/^Capitolul\s+\d+/i) || text.match(/^Capitol\s+\d+/i)) {
        chapterElements.push(p);
      }
    });
  }
  
  if (chapterElements.length === 0) {
    // Dacă tot nu găsim capitole, creează un singur capitol cu tot conținutul
    chapters.push({
      title: 'Document complet',
      content: htmlContent,
      id: 'chapter-1'
    });
    return chapters;
  }

  chapterElements.forEach((chapterElement, index) => {
    const chapterTitle = chapterElement.textContent?.trim() || `Capitol ${index + 1}`;
    const chapterId = `chapter-${index + 1}`;
    
    console.log(`Procesez capitolul: ${chapterTitle}`);
    
    // Găsește conținutul dintre acest capitol și următorul
    let content = '';
    let currentElement: Element | null = chapterElement;
    const nextChapterElement = chapterElements[index + 1];
    
    // Includem elementul curent (titlul capitolului)
    content += currentElement.outerHTML;
    
    // Parcurge următoarele elemente până la următorul capitol
    currentElement = currentElement.nextElementSibling;
    
    while (currentElement && currentElement !== nextChapterElement) {
      // Verifică dacă elementul curent nu este începutul unui alt capitol
      const elementText = currentElement.textContent?.trim() || '';
      if (!elementText.match(/^Capitolul\s+\d+/i) && !elementText.match(/^Capitol\s+\d+/i)) {
        content += currentElement.outerHTML;
      } else {
        break;
      }
      currentElement = currentElement.nextElementSibling;
    }
    
    // Dacă nu am găsit conținut după titlu, încearcă să găsești în parent
    if (content === chapterElement.outerHTML) {
      let parent = chapterElement.parentElement;
      while (parent && parent !== doc.body) {
        let sibling = parent.nextElementSibling;
        while (sibling && sibling !== nextChapterElement?.parentElement) {
          const siblingText = sibling.textContent?.trim() || '';
          if (!siblingText.match(/^Capitolul\s+\d+/i) && !siblingText.match(/^Capitol\s+\d+/i)) {
            content += sibling.outerHTML;
          } else {
            break;
          }
          sibling = sibling.nextElementSibling;
        }
        break;
      }
    }
    
    chapters.push({
      title: chapterTitle,
      content: content || '<p>Conținut nedisponibil</p>',
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
