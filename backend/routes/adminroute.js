const dotenv = require('dotenv');
dotenv.config();

const { Router } = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const adminrouter = Router();
const bcrypt = require('bcryptjs');

adminrouter.post('/login',async (req,res)=>{
    try {
        const user = await User.findOne({email:req.body.email,is_admin:true});
        if(!user){
            return res.status(400).send({
                message:"User not found"
            })
        }

        if(!(await bcrypt.compare(req.body.password,user.password))){
            return res.status(400).send({
                message:"Password is Incorrect"
            })
        }

        const token = jwt.sign({_id:user._id},"secret");

        res.cookie("jwt",token,{
            httpOnly:true,
            maxAge:24*60*60*1000
        })

        res.send({
            message:"success"
        })
    } catch (error) {
        console.log(error.message);
    }
})

adminrouter.post('/logout',async (req,res)=>{
    try {
        res.cookie("jwt","",{maxAge:0})
        res.send({
            message:"success"
        })
    } catch (error) {
        
    }
})

adminrouter.get('/active',async (req,res)=>{
    try {
       const cookie = req.cookies["jwt"];
       const claims = jwt.verify(cookie,"secret")
       if(!claims){
        return res.status(401).send({
            message:"unauthenticated"
        })
       } 

       const user = await User.findOne({_id:claims._id})
       const {password, ...data} = await user.toJSON();
       console.log(data);
       res.send(data)
    } catch (error) {
        return res.status(401).send({
            message:"unauthenticated"
        })
    }
})

adminrouter.get('/users',async (req,res)=>{
    try {
        const user = await User.find({})
        // const {password, ...data} = await user.toJSON();
        console.log(user);
        res.send(user)
    } catch (error) {
        console.log(error.message);
    }
})

adminrouter.post('/deleteUser/:id',async (req,res)=>{
    try {
        const deleteUser = await User.deleteOne({_id:req.params.id});
        if(!deleteUser){
            res.send({
                message:"Deletion went wrong"
            })
        }
        console.log(deleteUser);
        res.send(deleteUser);
    } catch (error) {
        
    }
})

adminrouter.post('/editDetails/:id',async(req,res)=>{
    try {
        const userData = await User.findOne({_id:req.params.id});
        if(!userData){
            res.send({
                message:"Something went wrong"
            })
        }
        const {password,...data} = await userData.toJSON();
        console.log(data);
        res.send(data);
    } catch (error) {
        console.log(error.message);
    }
})

adminrouter.post('/editUser',async(req,res)=>{
    try {
        let name = req.body.name;
        let userupdate = await User.updateOne({email:req.body.email},{$set:{name:name}});
        res.send({
            message:"success"
        })
    } catch (error) {
        console.log(error.message);
    }
})

adminrouter.post('/createuser',async(req,res)=>{
    try {
        let email = req.body.email;
    let password = req.body.password;
    let name = req.body.name;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt);
    const record = await User.findOne({email:email});

    if(record){
        return res.status(400).send({
            message:"Email is already registered"
        })
    }else{
        const user = new User({
            name:name,
            email:email,
            password:hashedPassword
        })
        const result = await user.save();

        //jwt token
        const {_id} = await result.toJSON();
        const token = jwt.sign({_id:_id},"secret");

        res.cookie("jwt",token,{
            httpOnly:true,
            maxAge:24*60*60*1000
        })

        res.send({
            message:"success"
        })   
    }
    } catch (error) {
        console.log(error.message);
    }
})

module.exports = adminrouter;