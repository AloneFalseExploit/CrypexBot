const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const KEY = "clave_secreta_123";

function obfuscar(text, key) {
  return Buffer.from(
    text.split("").map((c, i) =>
      c.charCodeAt(0) ^ key.charCodeAt(i % key.length)
    )
  ).toString("base64");
}

function deobfuscar(encoded, key) {
  const bytes = Buffer.from(encoded, "base64");
  return Array.from(bytes).map((b, i) =>
    String.fromCharCode(b ^ key.charCodeAt(i % key.length))
  ).join("");
}

client.on("ready", () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  if (msg.content.startsWith("!obf ")) {
    const texto = msg.content.slice(5);
    const resultado = obfuscar(texto, KEY);
    const embed = new EmbedBuilder()
      .setTitle("🔒 Texto Obfuscado")
      .setDescription("```" + resultado + "```")
      .setColor(0x5865F2)
      .setFooter({ text: "Usa !deobf para revertirlo" });
    msg.reply({ embeds: [embed] });
  }

  if (msg.content.startsWith("!deobf ")) {
    const codigo = msg.content.slice(7).trim();
    try {
      const resultado = deobfuscar(codigo, KEY);
      const embed = new EmbedBuilder()
        .setTitle("🔓 Texto Deobfuscado")
        .setDescription("```" + resultado + "```")
        .setColor(0x57F287);
      msg.reply({ embeds: [embed] });
    } catch {
      msg.reply("❌ Código inválido.");
    }
  }

  if (msg.content === "!ayuda") {
    const embed = new EmbedBuilder()
      .setTitle("📖 Comandos")
      .addFields(
        { name: "!obf <texto>", value: "Obfusca un texto" },
        { name: "!deobf <código>", value: "Deobfusca un texto" }
      )
      .setColor(0xFEE75C);
    msg.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
