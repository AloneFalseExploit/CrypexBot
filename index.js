const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

function generarClave() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let clave = "";
  for (let i = 0; i < 32; i++) {
    clave += chars[Math.floor(Math.random() * chars.length)];
  }
  return clave;
}

function nombreFalso() {
  const prefijos = ["_0x", "_a", "_b", "_c", "_d"];
  const p = prefijos[Math.floor(Math.random() * prefijos.length)];
  return p + Math.floor(Math.random() * 0xffff).toString(16);
}

function codigoBasura() {
  const n1 = nombreFalso();
  const n2 = nombreFalso();
  const n3 = nombreFalso();
  const val = Math.floor(Math.random() * 9999);
  return `local ${n1}=${val} local ${n2}=${n1}*${val} local ${n3}=${n2}+${n1} `;
}

function xorCifrar(text, key) {
  return Buffer.from(
    text.split("").map((c, i) =>
      c.charCodeAt(0) ^ key.charCodeAt(i % key.length)
    )
  ).toString("base64");
}

function obfuscarLua(codigo) {
  const clave = generarClave();

  let cifrado = xorCifrar(codigo, clave);
  cifrado = cifrado.split("").reverse().join("");
  cifrado = Buffer.from(cifrado).toString("base64");

  const claveBytes = clave.split("").map(c => c.charCodeAt(0)).join(",");
  const dataBytes = cifrado.split("").map(c => c.charCodeAt(0)).join(",");

  const nData = nombreFalso();
  const nClave = nombreFalso();
  const nResult = nombreFalso();
  const nI = nombreFalso();
  const nB = nombreFalso();
  const nDec = nombreFalso();
  const nLoad = nombreFalso();

  const basura1 = codigoBasura();
  const basura2 = codigoBasura();
  const basura3 = codigoBasura();

  const luaObfuscado = `-- Protected by CrypexBot
${basura1}
local ${nData}={${dataBytes}}
local ${nClave}={${claveBytes}}
${basura2}
local ${nResult}=""
local ${nDec}=""
for ${nI}=1,#${nData} do
${nDec}=${nDec}..string.char(${nData}[${nI}])
end
${basura3}
local ${nB}=""
for ${nI}=1,#${nClave} do
${nB}=${nB}..string.char(${nClave}[${nI}])
end
local function ${nLoad}(s,k)
local r=""
local sb={}
for i=1,#s do sb[i]=string.byte(s,i) end
local kb={}
for i=1,#k do kb[i]=string.byte(k,i) end
local b64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
local t,p,n={},0,0
for i=1,#s do
local c=b64:find(s:sub(i,i))
if c then p=p*64+(c-1) n=n+6
if n>=8 then n=n-8 t[#t+1]=string.char(math.floor(p/2^n)%256) end
end
end
local d=table.concat(t)
d=d:reverse()
local res=""
local kl=#k
for i=1,#d do
res=res..string.char(string.byte(d,i)~string.byte(k,(i-1)%kl+1))
end
return res
end
local ${nResult}=${nLoad}(${nDec},${nB})
load(${nResult})()`;

  return luaObfuscado;
}

function deobfuscarLua(texto) {
  const dataMatch = texto.match(/local \w+={([\d,]+)}/);
  const claveMatch = texto.match(/local \w+={([\d,]+)}/g);
  if (!dataMatch || !claveMatch || claveMatch.length < 2) return null;

  const dataBytes = dataMatch[1].split(",").map(Number);
  const claveBytes = claveMatch[1].match(/{([\d,]+)}/)[1].split(",").map(Number);

  const datos = dataBytes.map(b => String.fromCharCode(b)).join("");
  const clave = claveBytes.map(b => String.fromCharCode(b)).join("");

  let dec = Buffer.from(datos, "base64").toString("utf8");
  dec = dec.split("").reverse().join("");
  const bytes = Buffer.from(dec, "base64");
  return Array.from(bytes).map((b, i) =>
    String.fromCharCode(b ^ clave.charCodeAt(i % clave.length))
  ).join("");
}

client.on("ready", () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  // !obf con archivo
  if (msg.content.startsWith("!obf") && msg.attachments.size > 0) {
    const archivo = msg.attachments.first();
    if (!archivo.name.endsWith(".lua") && !archivo.name.endsWith(".txt")) {
      return msg.reply("❌ Solo se aceptan archivos .lua o .txt");
    }
    try {
      const response = await fetch(archivo.url);
      const texto = await response.text();
      const resultado = obfuscarLua(texto);
      const buffer = Buffer.from(resultado, "utf-8");
      const attachment = new AttachmentBuilder(buffer, { name: "obfuscado.lua" });
      const embed = new EmbedBuilder()
        .setTitle("🔒 Archivo Obfuscado")
        .setDescription("Lua válido y protegido 👇")
        .setColor(0x5865F2);
      msg.reply({ embeds: [embed], files: [attachment] });
    } catch {
      msg.reply("❌ Error al procesar el archivo.");
    }
    return;
  }

  // !obf texto
  if (msg.content.startsWith("!obf ")) {
    const texto = msg.content.slice(5);
    const resultado = obfuscarLua(texto);
    const buffer = Buffer.from(resultado, "utf-8");
    const attachment = new AttachmentBuilder(buffer, { name: "obfuscado.lua" });
    const embed = new EmbedBuilder()
      .setTitle("🔒 Código Obfuscado")
      .setDescription("Lua válido y protegido 👇")
      .setColor(0x5865F2);
    msg.reply({ embeds: [embed], files: [attachment] });
  }

  // !deobf con archivo
  if (msg.content.startsWith("!deobf") && msg.attachments.size > 0) {
    const archivo = msg.attachments.first();
    try {
      const response = await fetch(archivo.url);
      const texto = await response.text();
      const resultado = deobfuscarLua(texto);
      if (!resultado) return msg.reply("❌ No se pudo deobfuscar. ¿Es un archivo de CrypexBot?");
      const buffer = Buffer.from(resultado, "utf-8");
      const attachment = new AttachmentBuilder(buffer, { name: "deobfuscado.lua" });
      const embed = new EmbedBuilder()
        .setTitle("🔓 Archivo Deobfuscado")
        .setDescription("Aquí está tu código original 👇")
        .setColor(0x57F287);
      msg.reply({ embeds: [embed], files: [attachment] });
    } catch {
      msg.reply("❌ Error al procesar el archivo.");
    }
    return;
  }

  // !ayuda
  if (msg.content === "!ayuda") {
    const embed = new EmbedBuilder()
      .setTitle("📖 Comandos")
      .addFields(
        { name: "!obf + archivo .lua", value: "Obfusca un archivo Lua" },
        { name: "!obf <texto>", value: "Obfusca código Lua" },
        { name: "!deobf + archivo .lua", value: "Deobfusca un archivo de CrypexBot" }
      )
      .setColor(0xFEE75C);
    msg.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
