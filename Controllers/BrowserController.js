const Post = require("../Model/Post");

exports.getIndexPage = async (req, res) => {
    try {                                                                    
        const result = await Post.find().sort({createdAt:-1});
        res.status(200).json(result);
    } catch (err) {
        res.status(404).json({ message: "no posts not found!" });
        console.log(err);
    }       
};
exports.getSinglePage = async (req, res) => {
    const postId = req.params.postId;
    try {
        const result = await Post.findById(postId);
        res.status(200).json(result);
    } catch (err) {
        res.status(404).json({ message: "Post not found!" });
        console.log(err);
    }
};

exports.search = async (req, res) => {
    const query = req.query.filter;
    if (query == "") {
        return res.status(200).json({ posts: [] });
    }
    const myReg = new RegExp(query, "gi");
    try {
        const posts = await Post.find({ title: { $regex: myReg } })
            .select("title image.url content")
            .limit(4);
        res.status(200).json({ posts });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};
