//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/ToDoListDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set('useFindAndModify', false);

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const listItemSchema = {
  name: String
};

const Item = mongoose.model("Item", listItemSchema);

const Item1 = new Item({
  name: "Press + to add item"
});

const Item2 = new Item({
  name: "<----  Check item to delete "
});

const defaultList = [Item1, Item2];

const listSchema = {
  name: String,
  items: [listItemSchema]
};

const List = mongoose.model("list", listSchema);


app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (!err) {
      if (foundItems.length == 0) {
        Item.insertMany(defaultList, function(err) {
          console.log(err);
        });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: foundItems //Pass in the mongoitem list found to EJS (Display list : DB list)
        });
      };
    };
  });
});

app.get("/:customList", function(req, res) {
  const customList = _.capitalize(req.params.customList);

  List.findOne({ name: customList }, function(err, foundList) {
    if (!err) {
      if(!foundList){
        const list = new List({
        name: customList,
        items:  defaultList
        })
        list.save();
        res.redirect("/" + customList);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
    };
  };
})
});

app.post("/delete", function(req, res) {
  const checkeditem = req.body.checkedItem;
  const listName = req.body.checkedListName;

  if(listName === "Today"){

    Item.findByIdAndRemove(checkeditem, function(err) {
      if (!err) {
        res.redirect("/");
      };
    });
  }else{
    List.findOneAndUpdate({name : listName}, {$pull: {items: {_id : checkeditem}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }
});

app.post("/", function(req, res) {
  const newItemName = req.body.newItem;
 const listName = req.body.list;

  const newItem = new Item({
    name: newItemName
  });

  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  }else {
    List.findOne({name : listName}, function(err, foundList){
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      })
    }
  });

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
