const cloudinary = require('cloudinary').v2;
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'DELETE') {
    try {
      const publicId = new URL(req.url, 'http://x').searchParams.get('publicId');
      await cloudinary.uploader.destroy(publicId);
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ message: e.message }); }
  }
  try {
    const r = await cloudinary.search.expression('folder:portfolio_gallery').sort_by('created_at','desc').max_results(100).execute();
    res.status(200).json(r.resources.map(i => ({ id: i.public_id, url: i.secure_url, publicId: i.public_id, name: i.filename, createdAt: i.created_at })));
  } catch(e) { res.status(500).json({ message: e.message }); }
};
