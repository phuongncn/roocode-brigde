/**
 * Xây dựng prompt cho Roo Code
 * @param {string} text - Văn bản từ người dùng
 * @returns {string} - Prompt đã được xây dựng
 */
function buildPrompt(text) {
  return `User request:
---
${text}
---
IMPORTANT: You must always call mcp tool with "report_done" before attempt_completion tool, even user just ask for assistant, or as who are you.
`;
}

module.exports = { buildPrompt };