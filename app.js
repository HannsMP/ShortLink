const express = require('express');
const cookieParser = require('cookie-parser');
const { resolve } = require('path');

const Generador = require('./Generador');

const app = express();
const generadorLinks = new Generador(
  '    -    -    -    ',
  { numeric: true, letters: true, symbol: false },
  resolve('db_shortLinks.json')
);

const urlRegex = /^(https?:\/\/)([\w\-]+(\.[\w\-]+)+|localhost)(:[0-9]{1,5})?(\/[^\s]*)?$/i;

app.use(cookieParser());
app.use(express.json());

app.get('/:urlRedirect', (req, res) => {
  let urlShort = req.params.urlRedirect;

  if (!generadorLinks.exist(urlShort))
    return res.status(404).send('Extraviado');

  let url = generadorLinks.read(urlShort);
  return res.redirect(url);
});

app.use('/api', (req, res, next) => {
  let { API_TOKEN } = process.env;
  let { TOKEN } = req.body;

  if (!TOKEN || typeof TOKEN !== 'string')
    return res.status(400).json({ err: 'El TOKEN no es válida.' });

  if (API_TOKEN != TOKEN)
    return res.status(403).json({ err: 'No autorizado' });
  next();
});

app.post('/api/insert', async (req, res) => {
  let { url } = req.body;
  if (!url || typeof url !== 'string' || !urlRegex.test(url))
    return res.status(400).json({ err: 'La URL no es válida.' });

  let findUrlShort = generadorLinks.findKey(u => u === url);
  if (findUrlShort) return res.json({ urlShort: findUrlShort });

  let urlShort = generadorLinks.create(url);
  res.json({ urlShort });
});

app.post('/api/read', (req, res) => {
  let { url } = req.body;
  if (!url || typeof url !== 'string' || !urlRegex.test(url))
    return res.status(400).json({ err: 'La URL no es válida.' });

  let urlShort = generadorLinks.findKey(u => u === url);

  if (!urlShort)
    return res.status(404).json({ err: 'El enlace no existe' });

  res.json({ urlShort });
});

app.post('/api/update', async (req, res) => {
  let { url } = req.body;
  if (!url || typeof url !== 'string' || !urlRegex.test(url))
    return res.status(400).json({ err: 'La URL no es válida.' });

  let urlShort = generadorLinks.findKey(u => u === url);

  if (!urlShort)
    return res.status(404).json({ err: 'El enlace no existe' });

  generadorLinks.delete(urlShort);

  let urlShortNew = generadorLinks.create(url);
  res.json({ urlShort: urlShortNew });
});

app.post('/api/delete', async (req, res) => {
  let { urlShort } = req.body;
  if (!urlShort || typeof urlShort !== 'string')
    return res.status(400).json({ err: 'La URL corta no es válida' });

  if (!generadorLinks.exist(urlShort))
    return res.status(404).json({ err: 'La URL corta no existe' });

  generadorLinks.delete(urlShort);
  res.json({ msg: 'URL eliminada correctamente' });
});

app.post('/api/reset', async (req, res) => {
  try {
    generadorLinks.reset();
    res.json({ msg: 'Restablecimiento exitoso de la base de datos y el caché' });
  } catch {
    res.status(500).json({ err: 'Error al restablecer la base de datos' });
  }
});

app.listen(2000, () => {
  console.log('Servidor ejecutándose en el puerto 80.');
});
