export interface ParsedCommand {
  name: string;
  args: string[];
}

export class CommandParser {
  parse(input: string): ParsedCommand {
    const tokens = tokenizeInput(input);

    if (tokens.length === 0) {
      return {
        name: "",
        args: [],
      };
    }

    return {
      name: tokens[0],
      args: tokens.slice(1),
    };
  }
}

function tokenizeInput(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote ? null : char;
      continue;
    }

    if (char === " " && !quote) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }

      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}
