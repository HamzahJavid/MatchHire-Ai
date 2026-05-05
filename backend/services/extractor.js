"use strict";

const mammoth = require("mammoth");
const path = require("path");
const { PdfReader } = require("pdfreader");

async function extractText(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".pdf") {
        return new Promise((resolve, reject) => {
            let text = "";
            let pageCount = 0;

            new PdfReader().parseFileItems(filePath, (err, item) => {
                if (err) return reject(err);
                if (!item) {
                    // end of file
                    return resolve({ text, mimeType: "application/pdf", pageCount });
                }
                if (item.page) pageCount = item.page;
                if (item.text) text += item.text + " ";
            });
        });
    }

    if (ext === ".docx") {
        const result = await mammoth.extractRawText({ path: filePath });
        return {
            text: result.value,
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        };
    }

    throw new Error(
        `Unsupported file type: ${ext}. Only PDF and DOCX are accepted.`,
    );
}

module.exports = { extractText };