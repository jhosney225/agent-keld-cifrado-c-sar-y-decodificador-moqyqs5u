
```javascript
const Anthropic = require("@anthropic-ai/sdk");
const readline = require("readline");

const client = new Anthropic();

const caesarCipher = {
  encrypt: (text, shift) => {
    return text
      .split("")
      .map((char) => {
        if (/[a-z]/.test(char)) {
          return String.fromCharCode(
            ((char.charCodeAt(0) - 97 + shift) % 26) + 97
          );
        } else if (/[A-Z]/.test(char)) {
          return String.fromCharCode(
            ((char.charCodeAt(0) - 65 + shift) % 26) + 65
          );
        }
        return char;
      })
      .join("");
  },

  decrypt: (text, shift) => {
    return caesarCipher.encrypt(text, (26 - (shift % 26)) % 26);
  },

  bruteForce: (text) => {
    const results = [];
    for (let i = 1; i < 26; i++) {
      results.push({
        shift: i,
        decrypted: caesarCipher.decrypt(text, i),
      });
    }
    return results;
  },
};

async function analyzeCipherWithClaude(text, mode) {
  const prompt =
    mode === "encrypt"
      ? `I have the following text that I want to encrypt with a Caesar cipher using shift 3: "${text}". Please confirm the encrypted result should be: "${caesarCipher.encrypt(text, 3)}". Also explain how Caesar cipher works.`
      : `I have encrypted text: "${text}" that was encrypted with Caesar cipher shift 3. The decrypted text should be: "${caesarCipher.decrypt(text, 3)}". Can you confirm this is correct and explain the decryption process?`;

  console.log("\n🤖 Claude Analysis:");
  console.log("─".repeat(50));

  const stream = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 500,
    stream: true,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      process.stdout.write(event.delta.text);
    }
  }
  console.log("\n");
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  console.log("🔐 Caesar Cipher Encoder/Decoder");
  console.log("═".repeat(50));

  try {
    while (true) {
      console.log("\nOptions:");
      console.log("1. Encrypt text with Caesar cipher (shift 3)");
      console.log("2. Decrypt text with Caesar cipher (shift 3)");
      console.log("3. Brute force decrypt (try all shifts)");
      console.log("4. Get AI analysis of Caesar cipher");
      console.log("5. Exit");

      const choice = await question("\nSelect option (1-5): ");

      switch (choice) {
        case "1": {
          const text = await question("Enter text to encrypt: ");
          const encrypted = caesarCipher.encrypt(text, 3);
          console.log(`✓ Encrypted (shift 3): ${encrypted}`);
          const analyzeChoice = await question(
            "Get Claude's analysis? (y/n): "
          );
          if (analyzeChoice.toLowerCase() === "y") {
            await analyzeCipherWithClaude(text, "encrypt");
          }
          break;
        }

        case "2": {
          const text = await question("Enter text to decrypt: ");
          const decrypted = caesarCipher.decrypt(text, 3);
          console.log(`✓ Decrypted (shift 3): ${decrypted}`);
          const analyzeChoice = await question(
            "Get Claude's analysis? (y/n): "
          );
          if (analyzeChoice.toLowerCase() === "y") {
            await analyzeCipherWithClaude(text, "decrypt");
          }
          break;
        }

        case "3": {
          const text = await question("Enter encrypted text: ");
          console.log("\nBrute force results:");
          console.log("─".repeat(40));
          const results = caesarCipher.bruteForce(text);
          results.forEach((result) => {
            console.log(`Shift ${result.shift.toString().padEnd(2)}: ${result.decrypted}`);
          });
          break;
        }

        case "4": {
          console.log("\n📚 General Caesar Cipher Analysis:");
          console.log("─".repeat(50));

          const stream = await client.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 600,
            stream: true,
            messages: [
              {
                role: "user",
                content:
                  "Explain the Caesar cipher in detail. Include: 1) How it works, 2) Its history, 3) Why it's not secure, 4) Modern applications. Keep it concise but informative.",
              },
            ],
          });

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              process.stdout.write(event.delta.text);
            }
          }
          console.log("\n");
          break;
        }

        case "5":
          console.log(
            "\n👋 Thank