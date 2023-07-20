//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _=require("lodash")
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const PORT=process.env.PORT || 3000
mongoose.connect(process.env.URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  writeConcern: { w: "majority" }
});


const itemsSchema = new mongoose.Schema({

  name: {
    type: String,
    required: [true, "Please enter the item"]
  }
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: "Welcome to ToDoList"
});
const item2 = new Item({
  name: "Click on the + to add item"
});

const item3 = new Item({
  name: "<-- hit the button to delete the item"
})
const defaultItems = [item1, item2, item3];
// Item.insertMany(defaultItems).then(function(){
//   console.log("succesfully added to the list");
// }).catch(function(err){
//   console.log("error");
// });

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

let foundItems = [];
const initialFind = async function(res) {
  try {
    const Items = await Item.find();

    Items.forEach(function(item) {
      // Check if the item already exists in foundItems
      foundItems.push(item);
    });
    // mongoose.connection.close(15);
  } catch (error) {
    console.log(error);
    // mongoose.connection.close(15);
  }
};

try {
  initialFind();
} catch (err) {
  console.log(err);
}

app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("Default items added to the list");
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName) ;
  console.log(customListName);

  List.findOne({
      name: customListName
    })
    .then(function(foundList) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save()
          .then(function() {
            console.log("successfully added to the list");
          })
          .catch(function(err) {
            console.log(err);
          });
        res.redirect("/" + customListName);
      } else {
        //show a exsisting list
        console.log(foundList.name);
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      }
    })
    .catch(function(err) {
      console.log(err);
    });


});





app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today") {
    Item.insertMany(item).then(function() {
      console.log("doing ");
      foundItems.push(item);
    }).catch(function(err) {
      console.log(err);
    });
    res.redirect("/");
  } else {
    console.log("**" + listName);
    List.findOne({
      name: listName
    }).then(function(foundList) {
      foundList.items.push(item);
      foundList.save().then(function() {
        res.redirect("/" + listName);
      }).catch(function(err) {
        console.log(err);
      });
    }).catch(function(err) {
      console.log(err);
    });
  }
});


app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    const removeId = async function() {
      try {
        await Item.findByIdAndRemove(checkedItemId);
        console.log("Item got removed");
        foundItems = await Item.find();
        res.redirect("/");
      } catch (err) {
        console.log(err);
      }
    };
    removeId();
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
      .then(function(foundList) {
        if (foundList) {
          res.redirect("/" + listName);
        }
      })
      .catch(function(err) {
        console.log(err);
      });
  }
});


app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(PORT ,() => console.log('server is running on PORT'));
