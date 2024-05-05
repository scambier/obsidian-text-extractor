import { loadPdfJs } from 'obsidian'

onmessage = async evt => {
  await loadPdfJs();
  try {
    // @ts-ignore
    const pdf: PDFDocumentProxy = await window.pdfjsLib.getDocument(evt.data.path).promise;

    const pagePromises = [];
    // Get text from each page of the PDF
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
    console.info('Text Extractor - Could not extract text from ' + evt.data.path)
    self.postMessage({ text: '' })
  }
}

function decodeBase64(data: string) {
  return atob(data)
  // return Buffer.from(data, 'base64').toString()
}

