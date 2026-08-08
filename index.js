const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const KEY = "clave_secreta_123";

function obfuscar(text, key) {
  // Capa 1: XOR
  let xored = Buffer.from(
    text.split("").map((c, i) =>
      c.charCodeAt(0) ^ key.charCodeAt(i % key.length)
    )
  ).toString("base64");

  // Capa 2: Invertir el string
  let invertido = xored.split("").reverse().join("");

  // Capa 3: Otro Base64
  let final = Buffer.from(invertido).toString("base64");

  return final;
}

function deobfuscar(encoded, key) {
  // Revertir capa 3
  let invertido = Buffer.from(encoded, "base64").toString("utf8");

  // Revertir capa 2
  let xored = invertido.split("").reverse().join("");

  // Revertir capa 1
  const bytes = Buffer.from(xored, "base64");
  return Array.from(bytes).map((b, i) =>
    String.fromCharCode(b ^ key.charCodeAt(i % key.length))
  ).join("");
}

client.on("ready", () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  // !obf con archivo adjunto
  if (msg.content.startsWith("!obf") && msg.attachments.size > 0) {
    const archivo = msg.attachments.first();
    if (!archivo.name.endsWith(".lua") && !archivo.name.endsWith(".txt")) {
      return msg.reply("❌ Solo se aceptan archivos .lua o .txt");
    }
    try {
      const response = await fetch(archivo.url);
      const texto = await response.text();
      const resultado = obfuscar(texto, KEY);
      const buffer = Buffer.from(resultado, "utf-8");
      const attachment = new AttachmentBuilder(buffer, { name: "obfuscado.txt" });
      const embed = new EmbedBuilder()
        .setTitle("🔒 Archivo Obfuscado")
        .setDescription("Aquí está tu archivo obfuscado 👇")
        .setColor(0x5865F2);
      msg.reply({ embeds: [embed], files: [attachment] });
    } catch {
      msg.reply("❌ Error al procesar el archivo.");
    }
    return;
  }

  // !deobf con archivo adjunto
  if (msg.content.startsWith("!deobf") && msg.attachments.size > 0) {
    const archivo = msg.attachments.first();
    try {
      const response = await fetch(archivo.url);
      const texto = await response.text();
      const resultado = deobfuscar(texto.trim(), KEY);
      const buffer = Buffer.from(resultado, "utf-8");
      const attachment = new AttachmentBuilder(buffer, { name: "deobfuscado.lua" });
      const embed = new EmbedBuilder()
        .setTitle("🔓 Archivo Deobfuscado")
        .setDescription("Aquí está tu archivo deobfuscado 👇")
        .setColor(0x57F287);
      msg.reply({ embeds: [embed], files: [attachment] });
    } catch {
      msg.reply("❌ Error al procesar el archivo.");
    }
    return;
  }

  // !obf <texto>
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

  // !deobf <texto>
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

  // !ayuda
  if (msg.content === "!ayuda") {
    const embed = new EmbedBuilder()
      .setTitle("📖 Comandos")
      .addFields(
        { name: "!obf <texto>", value: "Obfusca un texto" },
        { name: "!obf + archivo .lua", value: "Obfusca un archivo Lua" },
        { name: "!deobf <código>", value: "Deobfusca un texto" },
        { name: "!deobf + archivo .txt", value: "Deobfusca un archivo" }
      )
      .setColor(0xFEE75C);
    msg.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
