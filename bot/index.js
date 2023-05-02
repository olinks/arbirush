const app = require("./app");
const { startLottery } = require("./lottery");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/static"));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/index.html"));
});
