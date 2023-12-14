const getCodeAndBuffer = (char: string): [Buffer, number] => [
  Buffer.from(char),
  char.charCodeAt(0),
];

export const [TokenInteger, TokenIntegerCode] = getCodeAndBuffer("i");
export const [TokenList, TokenListCode] = getCodeAndBuffer("l");
export const [TokenDictionary, TokenDictionaryCode] = getCodeAndBuffer("d");
export const [TokenEnd, TokenEndCode] = getCodeAndBuffer("e");
export const [TokenColon, TokenColonCode] = getCodeAndBuffer(":");
