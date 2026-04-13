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
IMPORTANT: When you finish the task, create a new file with the same name as the plan file but with "-done" inserted before ".md" (e.g. .plan/fix-01-keyword.md → create .plan/fix-01-keyword-done.md with content "done"). Do NOT rename or delete the original plan file. This signals completion to the pipeline manager.
`;
}

module.exports = { buildPrompt };