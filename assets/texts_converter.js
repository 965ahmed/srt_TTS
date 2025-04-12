// FB2 to TXT
function convertFb2ToTxt(fb2String) {
    const parser = new DOMParser();
    const fb2Doc = parser.parseFromString(fb2String.replace(/<p>/g, "\n<p>"), 'application/xml');
    let textContent = '';
    const bodyNode = fb2Doc.getElementsByTagName('body')[0];
    if (bodyNode) {
        const sectionNodes = bodyNode.getElementsByTagName('section');
        for (let i = 0; i < sectionNodes.length; i++) {
            const sectionNode = sectionNodes[i];
            const sectionText = sectionNode.textContent;
            textContent += sectionText + '\n\n';
        }
    }
    const txtString = textContent.trim();
    return txtString;
}

// EPUB to TXT
async function convertEpubToTxt(epubBinary) {
    const zip = await JSZip.loadAsync(epubBinary);
    const textFiles = [];
    let toc_path = "";
    zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.name.endsWith('.ncx')) {
            toc_path = relativePath.slice(0, relativePath.lastIndexOf("toc.ncx"));
        }
    });

    const toc = await zip.file(toc_path + 'toc.ncx').async('text');
    const parser = new DOMParser();
    const tocDoc = parser.parseFromString(toc, 'application/xml');
    const navPoints = tocDoc.getElementsByTagName('navPoint');
    for (let i = 0; i < navPoints.length; i++) {
        const src = toc_path + navPoints[i].getElementsByTagName('content')[0].getAttribute('src').split("#")[0];
        const file = zip.file(src);
        if (file) {
            textFiles.push(file);
        }
    }
    let textContent = '';
    for (const file of textFiles) {
        const fileText = await file.async('text');
        const htmlDoc = parser.parseFromString(fileText, 'application/xhtml+xml');
        const bodyNode = htmlDoc.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'body')[0];
        if (bodyNode) {
            const textNodes = bodyNode.childNodes;
            for (let i = 0; i < textNodes.length; i++) {
                const node = textNodes[i];
                if (node.textContent.trim() !== '') {
                    textContent += node.textContent.trim() + '\n';
                }
            }
            textContent += '\n\n';
        }
    }
    return textContent.trim();
}

// SRT to TXT (custom logic)
function convertSrtToTxt(input) {
    // Step 1: Replace all dots (.) with semicolons (;)
    let modifiedInput = input.replace(/\./g, ';');
    let output = '';

    // Step 2: Convert SRT blocks
    const srtBlocks = modifiedInput.split(/\n\s*\n/);
    for (let block of srtBlocks) {
        const lines = block.split('\n');
        if (lines.length >= 3) {
            lines.splice(0, 2); // Remove block number and timecode
            output += lines.join('\n') + '\n.\n';
        } else {
            output += block + '\n.\n';
        }
    }

    return output.trim();
}
