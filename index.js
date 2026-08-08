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

function xorDescifrar(encoded, key) {
  const bytes = Buffer.from(encoded, "base64");
  return Array.from(bytes).map((b, i) =>
    String.fromCharCode(b ^ key.charCodeAt(i % key.length))
  ).join("");
}

function obfuscarLua(codigo) {
  const clave = generarClave();

  // Capa 1: XOR + Base64
  let cifrado = xorCifrar(codigo, clave);

  // Capa 2: Invertir
  cifrado = cifrado.split("").reverse().join("");

  // Capa 3: Otro Base64
  cifrado = Buffer.from(cifrado).toString("base64");

  // Convertir clave a bytes Lua
  const claveBytes = clave.split("").map(c => c.charCodeAt(0)).join(",");

  // Convertir cifrado a bytes Lua
  const dataBytes = cifrado.split("").map(c => c.charCodeAt(0)).join(",");

  // Generar nombres falsos
  const nData = nombreFalso();
  const nClave = nombreFalso();
  const nResult = nombreFalso();
  const nI = nombreFalso();
  const nB = nombreFalso();
  const nDec = nombreFalso();
  const nLoad = nombreFalso();

  // Código basura
  const basura1 = codigoBasura();
  const basura2 = codigoBasura();
  const basura3 = codigoBasura();

  // Generar Lua obfuscado válido
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
-- decode base64
local b64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
local t,p,n={},0,0
for i=1,#s do
local c=b64:find(s:sub(i,i))
if c then p=p*64+(c-1) n=n+6
if n>=8 then n=n-8 t[#t+1]=string.char(math.floor(p/2^n)%256) end
end
end
local d=table.concat(t)
-- reverse
d=d:reverse()
-- xor
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

  // !ayuda
  if (msg.content === "!ayuda") {
    const embed = new EmbedBuilder()
      .setTitle("📖 Comandos")
      .addFields(
        { name: "!obf <texto>", value: "Obfusca código Lua" },
        { name: "!obf + archivo .lua", value: "Obfusca un archivo Lua completo" }
      )
      .setColor(0xFEE75C);
    msg.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
