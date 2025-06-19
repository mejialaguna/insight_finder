/* eslint-disable prefer-template */
export function extractJsonFromContent(content: string) {
  // Match all JSON-like objects in the string using lazy regex
  const jsonMatches = content.match(/\{.*?\}(?=\{|\s*$)/gs);
  if (!jsonMatches) {
    return { statusText: [], articles: [] };
  }

  try {
    const parsedObjects = jsonMatches.map((jsonStr) => JSON.parse(jsonStr));

    const statusText = parsedObjects
      .filter((obj) => obj.type === 'status')
      .map((obj) => obj.results)
      .join('');

    const statusLines = statusText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');

    const articles =
      parsedObjects.find((obj) => obj.type === 'articles')?.results || [];

    // Normalize _id and pubDate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizedArticles = articles.map((item: any) => {
      return {
        ...item,
        _id: item._id?.$oid || item._id,
        pubDate: item.pubDate?.$date || item.pubDate,
      };
    });

    return {
      statusText: statusLines,
      articles: normalizedArticles,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to parse content JSON:', err);
    return null;
  }
}

export const parserAiConcatJson = (jsonMatches: RegExpMatchArray) => {
  try {
    const parsedObjects = jsonMatches.flatMap((jsonStr) =>
      jsonStr
        .split(/(?<=})\s*(?={)/) // Split between "} {" without consuming braces
        .map((part) => JSON.parse(part))
        .filter(
          (obj) =>
            !obj.results.includes('Analyzing') &&
            !obj.results.includes('query...')
        )
    );

    // Combine results
    return parsedObjects.map((obj) => obj.results).join('');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('error ======>', error);
    return '';
  }
};

export function checkIsValidJsonType(jsonMatches: RegExpMatchArray) {
  try {
    // Attempt to parse the JSON string
    const jsonData = JSON.parse(jsonMatches.toString());

    // Check if the parsed JSON has "type": "articles"
    if (jsonData.type === 'articles') {
      return jsonData;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return parserAiConcatJson(jsonMatches);
  }
}
