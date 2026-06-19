const https = require("https");

https
  .get(
    "https://api.github.com/repos/Prince364133/kridaz/pulls/82/files",
    { headers: { "User-Agent": "node.js" } },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const files = JSON.parse(data);
          const images = files.filter((f) =>
            f.filename.match(/\.(png|jpg|jpeg|svg)$/i)
          );
          images.forEach((img) => {
            console.log(`Filename: ${img.filename}`);
            console.log(`URL: ${img.raw_url}`);
          });
        } catch (e) {
          console.error(e);
        }
      });
    }
  )
  .on("error", console.error);
