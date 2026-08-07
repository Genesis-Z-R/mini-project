/**
 * Normalizes a programme name for comparison and duplicate prevention.
 * E.g., "BSc Computer Science", "COMPUTER SCIENCE", "B.Sc. Computer Science" -> "computer science"
 */
export function normalizeProgrammeName(name) {
  if (!name || typeof name !== 'string') return '';
  
  let str = name.toLowerCase().trim();

  // Remove common degree prefixes
  str = str.replace(/^(bsc|b\.sc\.|b\.sc|bachelor of science in|bachelor of science|ba|b\.a\.|bachelor of arts in|diploma in|major in)\s+/i, '');

  // Remove non-alphanumeric punctuation
  str = str.replace(/[^a-z0-9\s]/g, '');

  // Collapse multiple spaces
  str = str.replace(/\s+/g, ' ').trim();

  return str || name.toLowerCase().trim();
}
