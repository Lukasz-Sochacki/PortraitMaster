const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if (title && author && email && file) {
      const emailPattern = /^[a-zA-Z0-9.\-_]+@[a-z0-9]+\.[a-z]{2,3}$/;
      const textPattern = /<|>/;

      const fileName = file.path.split('/').slice(-1)[0];
      const fileExt = fileName.split('.').slice(-1)[0];

      if (
        title.length <= 25 &&
        author.length <= 50 &&
        emailPattern.test(email) &&
        !textPattern.test(title) &&
        !textPattern.test(author) &&
        ['jpg', 'png', 'gif'].includes(fileExt)
      ) {
        const newPhoto = new Photo({
          title,
          author,
          email,
          src: fileName,
          votes: 0,
        });
        await newPhoto.save();
        res.json(newPhoto);
      } else {
        throw new Error('Wrong input!');
      }
    } else {
      throw new Error('Wrong input!');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const userIp = req.ip;
    const photoId = req.params.id;

    const photoToUpdate = await Photo.findOne({ _id: photoId });
    if (!photoToUpdate) {
      return res.status(404).json({ message: 'Not found' });
    }

    let voter = await Voter.findOne({ user: userIp });

    if (!voter) {
      voter = new Voter({ user: userIp, votes: [photoId] });
      await voter.save();
    } else {
      if (voter.votes.includes(photoId)) {
        return res
          .status(500)
          .json({ message: 'You have already voted for this photo!' });
      } else {
        voter.votes.push(photoId);
        await voter.save();
      }
    }

    photoToUpdate.votes++;
    await photoToUpdate.save();
    res.send({ message: 'OK' });
  } catch (err) {
    res.status(500).json(err);
  }
};
