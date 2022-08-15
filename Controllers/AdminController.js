const Post = require("../Model/Post");
const {BlobServiceClient, StorageSharedKeyCredential} = require("@azure/storage-blob");
const User = require("../Model/User");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sgMail = require("@sendgrid/mail");
const { validationResult } = require("express-validator");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const account='rajath';
const accountKey='yWeUA4Pdiub/22Ynl4ydW/90W0y1jXXnBfD5FCyPqok6Fge5nJ3nOt7L3FIb1kyTK4tZjufEXPtQ+AStEQ99xQ==';
const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
const blobServiceClient = new BlobServiceClient(
`https://${account}.blob.core.windows.net`,
sharedKeyCredential
);
const containerClient = blobServiceClient.getContainerClient('blog-images');


// const bufferToStream = (buffer) => {
//     const readable = new Readable({
//         read() {
//             this.push(buffer);
//             this.push(null);
//         },
//     });
//     return readable;
// };

exports.postEditPost = async (req, res) => {
    let errors = [];
    errors = validationResult(req).errors;
    if (errors.length > 0) {
        console.log(req.body);
        return res.status(422).json({ errors: errors });
    }
    try {
        const title = req.body.title;
        const content = req.body.content;
        const data = await sharp(req.file.buffer)
            .webp({ quality: 20 })
            .resize({ width: 864, height: 524, fit: sharp.fit.cover })
            .toBuffer();
            const containerClient = blobServiceClient.getContainerClient('blog-images');
            const uid = `${(Math.random() + 1).toString(36).substring(2)}.webp`;
            const blockBlobClient = containerClient.getBlockBlobClient(uid);
            await blockBlobClient.uploadData(data);
            const image = `https://${account}.blob.core.windows.net/blog-images/${uid}`;
                const user = await User.findById(req.id);
                const author = user.name;
                const userId = user._id;

                const posts = new Post({
                    title,
                    content,
                    image,
                    author,
                    userId,
                });
                const result = await posts.save();
                const postId = result._id;
                await User.updateOne(
                    { _id: req.id },
                    { $push: { posts: postId } }
                );
                const postCount = await User.findOne({ _id: req.id });
                res.status(201).json({
                    message: "Post created successfully",
                    data: postCount.posts.length,
                });
        // bufferToStream(data).pipe(stream);
    } catch (err) {
        res.status(500).json({ message: err.message, error: err });
        console.log(err);
    }
};

exports.getAdmin = async (req, res) => {
    try {
        const userPost = await User.findById(req.id).populate("posts");
        res.json({ posts: userPost.posts });
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Something went wrong" });
    }
};

exports.deleteAccount = async (req, res) => {
    const id = req.id;
    User.findByIdAndRemove(id)
        .then(() => {
            res.status(200).json({ message: "Account deleted successfully!" });
        })
        .catch((err) => {
            res.status(500).json({
                message: "Something went wrong!",
                error: err,
            });
        });
};

exports.deletePost = async (req, res) => {
    const id = req.body.id;
    try {
        await User.updateOne({ $pull: { posts: { $in: id } } });
        const post = await Post.findById(id);
        imageUrl = post.image.split('blog-images/')[1];

        const blockBlobClient = containerClient.getBlockBlobClient(imageUrl);
        const result = await blockBlobClient.deleteIfExists();
        console.log(result);

        await Post.findByIdAndRemove(id).then(() => {
            res.status(200).json({ message: "Post deleted successfully!" });
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Something went wrong",
            error: err,
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.id).select(
            "email createdAt name posts"
        );
        res.status(200).json({ user: user });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong!" });
    }
};

exports.postForgotPassword = async (req, res) => {
    const { email } = req.body;
    const re =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!re.test(email)) {
        return res.status(422).json({ error: "Invalid email" });
    }

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res
                .status(422)
                .json({ error: "No user found with this email" });
        }
        const key = jwt.sign({ data: user._id }, process.env.SECRET_KEY, {
            expiresIn: "10min",
        });
        const url = `${process.env.CLIENT_URL}/admin/reset-password/${key}`;

        const msg = {
            to: email,
            from: `Blog <rajathgatty001@gmail.com>`,
            subject: "Blog password reset",
            text: "and easy to do anywhere, even with Node.js",
            html: `<div style="margin:auto;width:100%"><a href=${url}>click here</a><small> to reset Password</small><div>`,
        };
        res.status(200).json({ sucess: true, message: "Email sent" });

        sgMail.send(msg).catch((error) => {
            res.status(500).json({ error: "Email not sent" });
        });
    } catch (err) {
        return res.status(401).json({ error: err.message });
    }
};

exports.getResetPassword = async (req, res) => {
    const { token } = req.params;
    try {
        const result = jwt.verify(token, process.env.SECRET_KEY);
        res.status(200).json({ valid: true });
    } catch (err) {
        res.status(422).json({ error: err.message });
    }
};

exports.postResetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        const result = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findById(result.data);
        console.log(user);
        const hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
        await user.save();
        res.json({ sucess: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
