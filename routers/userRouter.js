import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import data from '../data.js';
import User from '../models/userModel.js';
import { generateToken, isAdmin, isAuth } from '../utils.js';

const userRouter = express.Router();

userRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        // await User.remove({});
        const createdUsers = await User.insertMany(data.users);
        res.send({ createdUsers });
    })
);

userRouter.post("/signin",expressAsyncHandler(async(req,res)=>{
    const user = await User.findOne({email:req.body.email});
    if(user){
        if(bcrypt.compareSync(req.body.password, user.password))
        {
            res.send({
                _id: user._id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                isAdmin: user.isAdmin,
                isSeller: user.isSeller,
                token: generateToken(user),
            });
            return;
        }
    }
    res.status(401).send({ message: 'Invalid email or password'});
}));

userRouter.post("/signup",expressAsyncHandler(async(req,res) => {
    const user = new User({
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
    });
    const createdUser = await user.save();
    res.send({
        _id: createdUser._id,
        name: createdUser.name,
        surname: createdUser.surname,
        email: createdUser.email,
        isAdmin: createdUser.isAdmin,
        isSeller: createdUser.isSeller,
        token: generateToken(createdUser),
    });
}));

userRouter.get("/:id",expressAsyncHandler(async (req,res)=>{
    const user = await User.findById(req.params.id);
    if(user){
        res.send(user);
    } else{
        res.status(404).send({message:"User not found"});
    }
}));

userRouter.put("/profile",isAuth,expressAsyncHandler(async (req,res)=>{
    const user = await User.findById(req.user._id);
    if(user){
        user.name = req.body.name || user.name;
        user.surname = req.body.surname || user.surname;
        user.email = req.body.email || user.email;
        if(user.isSeller){
            user.seller.name = req.body.sellerName || user.seller.name;
            user.seller.logo = req.body.sellerLogo || user.seller.logo;
        }
        if(req.body.password){
            user.password = bcrypt.hashSync(req.body.password, 8);
        }
        const updatedUser = await user.save();
        res.send({
            name: updatedUser.name,
            surname: updatedUser.surname,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            isSeller: user.isSeller,
            token: generateToken(updatedUser),
        });
    }
}));

userRouter.get("/",isAuth,isAdmin,expressAsyncHandler(async(req,res)=>{
    const users = await User.find({});
    res.send(users);
}));

userRouter.delete("/:id",isAuth,isAdmin,expressAsyncHandler(async(req,res)=>{
    const user = await User.findById(req.params.id);
    if(user){
        if(user.email === "admin@example.com"){
            res.status(400).send({message:"Admin cannot be deleted"});
        }
        const deleteUser = await user.remove();
        res.send({message:"User is deleted",user: deleteUser});
    }else{
        res.status(404).send({message:"User not found"});
    }
}));

userRouter.put("/:id",isAuth,isAdmin,expressAsyncHandler(async(req,res)=>{
    const user = await User.findById(req.params.id);
    if(user){
        user.name = req.body.name || user.name;
        user.surname = req.body.surname || user.surname;
        user.isSeller = Boolean(req.body.isSeller);
        user.isAdmin = Boolean(req.body.isAdmin);
        const updatedUser = user.save();
        res.send({message:"User is updated",user:updatedUser});
    }else{
        res.status(404).send({message:"User not found"});
    }
}));

export default userRouter;