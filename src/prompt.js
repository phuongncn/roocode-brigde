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
IMPORTANT: When you finish the task, rename the plan file by adding "-done" before the ".md" extension (e.g. plan/fix-01-keyword.md → plan/fix-01-keyword-done.md). This signals completion to the pipeline manager.
`;
}

module.exports = { buildPrompt };