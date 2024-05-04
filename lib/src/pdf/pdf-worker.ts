import PDFJSStatic from 'pdfjs-dist';
//import getDocument from 'pdfjs-dist';

//import * as pdfjslib from 'pdfjs-dist';
//let PDFPageProxy = pdfjslib.PDFJS;

onmessage = async path => {
  try {
    const pdf = await PDFJSStatic.getDocument(path).promise;

    const pagePromises = [];
    for (let j = 1; j <= pdf.numPages; j++) {
      const page = pdf.getPage(j);

      pagePromises.push(page.then((page) => {
        const textContent = page.getTextContent();
        return textContent.then((text) => {
          return text.items.map((s) => s).join('');
        });
      }));
    }

    const texts = await Promise.all(pagePromises);
    self.postMessage({ text: texts.join('') });
  } catch (e) {
    console.info('Text Extractor - Could not extract text from ' + path)
    self.postMessage({ text: '' })
  }
}

function decodeBase64(data: string) {
  return atob(data)
  // return Buffer.from(data, 'base64').toString()
}

