export const dateFormatter = (date: Date) => {
const formatted = date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
    day: 'numeric',
  });

  return formatted;
};
