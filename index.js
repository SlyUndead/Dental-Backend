const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const FormData = require('form-data');
const jwtSecretKey = "AgpDental"
const axios = require('axios');
// const { createCanvas, loadImage } = require('canvas');
// const sharp = require('sharp')
const app = express();
const upload = multer({ dest: 'AnnotatedFiles/', storage: multer.memoryStorage() });
app.use(function (req, res, next) {
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://agp-dental-dental.mdbgo.io',
        'https://agp-ui-dental.mdbgo.io',
        'https://agp_ui-dental.mdbgo.io'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Accept-Encoding, Accept-Language, Connection, Host, Referer, Sec-Ch-Ua, Sec-Ch-Ua-Mobile, Sec-Ch-Ua-Platform, Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site, User-Agent, Authorization");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Expose-Headers", "New-Token");
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});

// const corsOptions = {
//     origin: '*', // Replace this with the allowed origin
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
// };
app.use(cors())
//app.use(cors(corsOptions));
app.use(express.json({ limit: '10000mb' }));
app.use(express.urlencoded({ limit: '10000mb', extended: true }));
async function connectToDatabase() {
    try {
        await mongoose.connect('mongodb://agp-ui_agp:Dental%40123@mongo.db.mdbgo.com:8604/agp-ui_agpui', {
        });
        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
}
connectToDatabase();


const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'No token provided.' });
    }

    jwt.verify(token, jwtSecretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token.' });
        }
        const inactivityPeriod = Date.now() - decoded.lastActivity;
        if (inactivityPeriod > 7200000) {
            return res.status(401).json({ 
                message: 'Token expired due to inactivity.',
                error: 'INACTIVITY_TIMEOUT'
            });
        }

        // Update lastActivity in token
        const newToken = jwt.sign({ 
            id: decoded.id,
            lastActivity: Date.now()
        }, jwtSecretKey, { 
            expiresIn: '24h' 
        });
        // Send new token in response header
        res.setHeader('New-Token', newToken);
        req.user = decoded;
        next();
    });
};


const PracticeListSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    contactNo: {
        type: String,
        required: true,
    }
}, {
    collection: "PracticeList"
})
const PracticeList = new mongoose.model('practiceList', PracticeListSchema)
const PatientSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
    },
    last_name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    telephone: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        required: true,
    },
    date_of_birth: {
        type: String,
        required: false,
    },
    reference_dob_for_age: {
        type: String,
        required: false,
    },
    guardian_first_name: {
        type: String,
        required: false,
    },
    guardian_last_name: {
        type: String,
        required: false,
    },
    guardian_relationship: {
        type: String,
        required: false,
    },
    address: {
        type: String,
        required: true,
    },
    is_active: {
        type: Boolean,
        required: true,
    },
    created_on: {
        type: String,
        required: true,
    },
    created_by: {
        type: String,
        required: true,
    },
    modified_on: {
        type: String,
        required: false,
    },
    modified_by: {
        type: String,
        required: false,
    },
    practiceId: {
        type: String,
        required: true,
    },
}, {
    collection: "Patient"
})
const Patient = new mongoose.model('patient', PatientSchema)
const ClassNameSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    yt_url1: {
        type: String,
        required: true,
    },
    yt_url2: {
        type: String,
        required: false,
    },
    thumbnail1: {
        type: String,
        required: true,
    },
    thumbnail2: {
        type: String,
        required: false,
    },
    created_on: {
        type: String,
        required: true,
    },
    created_by: {
        type: String,
        required: true,
    },
    modified_on: {
        type: String,
        required: false,
    },
    modified_by: {
        type: String,
        required: false,
    },
    is_deleted: {
        type: Boolean,
        required: true,
    }
}, {
    collection: 'ClassNames'
})
const ClassName = new mongoose.model('className', ClassNameSchema)
const PatientVisitSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
    },
    date_of_xray: {
        type: String,
        required: true,
    },
    notes: {
        type: String,
        required: false,
    },
    date_of_visit: {
        type: String,
        required: true,
    },
    summary: {
        type: String,
        required: false,
    },
    created_on: {
        type: String,
        required: true,
    },
    created_by: {
        type: String,
        required: true,
    }
}, {
    collection: "PatientVisits"
})
const PatientVisits = new mongoose.model('patientVisits', PatientVisitSchema)

const PatientImagesSchema = new mongoose.Schema({
    visitId: {
        type: String,
        required: true,
    },
    patientId: {
        type: String,
        required: true,
    },
    image_url: {
        type: String,
        required: true,
    },
    json_url: {
        type: String,
        required: true,
    },
    thumbnail_url: {
        type: String,
        required: true,
    },
    is_deleted: {
        type: Boolean,
        required: true,
    }
}, {
    collection: "PatientImages"
})
const PatientImages = new mongoose.model('patientImages', PatientImagesSchema)



app.get('/getPracticeList',verifyToken, async (req, res) => {
    try {
        // console.log(req.query.clientId);
        const practiceList = await PracticeList.find({
            "client_id": req.query.clientId
        })
        res.status(200).json({ practiceList })
    }
    catch (err) {
        res.status(500).json({ message: err })
    }
})
app.get('/getPatient',verifyToken, async (req, res) => {
    try {
        const practiceId = req.query.practiceId;
        const patientList = await Patient.find({
            "is_active": true,
            "practiceId": practiceId
        })
        res.status(200).json({ patientList })
    }
    catch (err) {
        res.status(500).json({ message: err })
    }
})

app.get('/getPatientByID',verifyToken, async (req, res) => {
    try {
        const patientId = req.query.patientId;
        const patientList = await Patient.findOne({
            "is_active": true,
            "_id": patientId
        })
        res.status(200).json({ patientList })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ message: err })
    }
})

app.post('/add-patient',verifyToken, async (req, res) => {
    try {
        if (await Patient.findOne({ "email": req.body.email })) {
            res.status(409).json({ message: "Patient already found" })
        }
        else {
            const date = new Date();
            const user = new Patient({
                "first_name": req.body.first_name, "last_name": req.body.last_name, "email": req.body.email, "telephone": req.body.telephone, "gender": req.body.gender,
                "date_of_birth": req.body.dob, "reference_dob_for_age": req.body.reference_dob_for_age, "guardian_first_name": req.body.guardian_first_name,
                "guardian_last_name": req.body.guardian_last_name, "guardian_relationship": req.body.guardian_relationship, "address": req.body.address,
                "is_active": req.body.is_active, "created_on": date.toUTCString(), "created_by": req.body.created_by, "practiceId": req.body.practiceId
            })
            await user.save()
            const user1 = await Patient.findOne({ "email": req.body.email })
            res.status(200).json({ user1 })
        }
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ err })
    }
})

app.post('/add-className', verifyToken, async (req, res) => {
    try {
        const thumbnail1Base64 = req.body.thumbnail1Base64;
        const fileName1 = req.body.fileName1;
        const date = new Date();
        const thumbnailData1 = thumbnail1Base64.replace(/^data:image\/\w+;base64,/, "");
        const thumbnailBinaryData1 = Buffer.from(thumbnailData1, 'base64');
        const thumbnailPath1 = path.join(__dirname, 'AnnotatedFiles', 'Thumbnail', `T${fileName1}`);
        // Save thumbnail
        await fs.promises.writeFile(thumbnailPath1, thumbnailBinaryData1);
        let thumbnailPath2 = null
        if (req.body.thumbnail2Base64) {
            const fileName2 = req.body.fileName2
            const thumbnail2Base64 = req.body.thumbnail2Base64;
            const thumbnailData2 = thumbnail2Base64.replace(/^data:image\/\w+;base64,/, "");
            const thumbnailBinaryData2 = Buffer.from(thumbnailData2, 'base64');
            thumbnailPath2 = path.join(__dirname, 'AnnotatedFiles', 'Thumbnail', `T${fileName2}`);
            // Save thumbnail
            await fs.promises.writeFile(thumbnailPath2, thumbnailBinaryData2);
        }
        const classDetails = new ClassName({
            "className": req.body.className, "description": req.body.description, "created_on": date.toUTCString(), "created_by": req.body.created_by, "category": req.body.category, "color": req.body.color,
            "is_deleted": false, "yt_url1": req.body.yt_url1, "yt_url2": req.body.yt_url2 || null, "thumbnail1": req.body.thumbnailPath1, "thumbnail2": req.body.thumbnailPath2
        })
        await classDetails.save()
        res.status(200)
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ err });
    }
})
app.get('/get-classCategories', verifyToken, async (req, res) => {
    try {
        // Fetch all documents and return only the category field
        const classDetails = await ClassName.find(
            { is_deleted: false },
            { _id: 0, category: 1, className: 1, color: 1 }
        );
        res.status(200).json(classDetails);
    }
    catch (err) {
        res.status(500).json({ err });
    }
})
app.get('/get-className', verifyToken, async (req, res) => {
    try {
        const classDetails = await ClassName.findOne({
            className: req.query.className, is_deleted: false
        })
        res.status(200).json(classDetails)
    }
    catch (err) {
        res.status(500).json({ err });
    }
})

app.post('/add-patientVisit', verifyToken, async (req, res) => {
    try {

        const date = new Date();
        const visit = new PatientVisits({
            "patientId": req.body.patientId, "date_of_xray": req.body.date_of_xray, "notes": req.body.notes, "date_of_visit": req.body.date_of_visit,
            "summary": req.body.summary, "created_on": date.toUTCString(), "created_by": req.body.created_by
        })
        await visit.save()
        const visitDetail = await PatientVisits.findOne({
            "patientId": req.body.patientId,
            "date_of_visit": req.body.date_of_visit, "created_on": date.toUTCString()
        })
        res.status(200).json({ visitDetail })

    }
    catch (err) {
        console.log(err)
        res.status(500).json({ err })
    }
})

app.post('/update-patientVisit', verifyToken, async (req, res) => {
    try {
        await PatientVisits.findOneAndUpdate({ "_id": req.body.visitId }, {
            $set: {
                "date_of_xray": req.body.date_of_xray,
                "notes": req.body.notes, "date_of_visit": req.body.date_of_visit, "summary": req.body.summary
            }
        })
        return res.status(200).json({ message: "Patient visit updated successfully" });
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ err })
    }
})

app.get('/getVisitDetailsById', verifyToken, async (req, res) => {
    try {
        const visitDetails = await PatientVisits.find({
            "_id": req.query.visitID
        })
        res.status(200).json({ visitDetails })
    }
    catch (err) {
        res.status(500).json({ message: err })
    }
})
//Patient images

app.get('/getPatientVisitsByID', verifyToken, async (req, res) => {
    try {
        const patientId = req.query.patientId;
        const patienVisits = await PatientVisits.find({
            "patientId": patientId
        }).sort({ date_of_visit: -1 })
        res.status(200).json({ patienVisits })
    }
    catch (err) {
        res.status(500).json({ message: err })
    }
})

app.get('/getPatientImagesByID', verifyToken, async (req, res) => {
    try {
        const patientId = req.query.patientId;
        const patienImages = await PatientImages.find({
            "patientId": patientId,
            "is_deleted": false
        })
        res.status(200).json({ patienImages })
    }
    catch (err) {
        res.status(500).json({ message: err })
    }
})

app.post('/delete-patient-image', verifyToken, async (req, res) => {
    try {
        const idsString = req.query.ids;
        const idsArray = idsString.split(',');
        const objectIds = idsArray.map(id => new mongoose.Types.ObjectId(id));

        const filter = { _id: { $in: objectIds } };
        const update = { is_deleted: true };
        const result = await PatientImages.updateMany(filter, update)
        res.status(200).json({
            message: 'Records updated successfully',
            modifiedCount: result.modifiedCount,
        });
    }

    catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal Server Error" })
    }
})


//----------------
app.get('/next-previousVisit', verifyToken, async (req, res) => {
    try {
        const visitId = req.query.visitId
        const patientId = req.query.patientId;
        const patientVisits = await PatientVisits.find({
            "patientId": patientId
        })
        patientVisits.sort((a, b) => a.date_of_visit - b.date_of_visit);
        const currentVisitIndex = patientVisits.findIndex(visit => visit._id.toString() === visitId);
        if (currentVisitIndex === -1) {
            // console.log(currentVisitIndex)
            return res.status(404).json({ message: 'Visit not found' });
        }
        if (req.query.next === "true") {
            res.status(200).json({ visitId: patientVisits[currentVisitIndex + 1], last: currentVisitIndex + 1 === patientVisits.length - 1 })
        }
        else {
            res.status(200).json({ visitId: patientVisits[currentVisitIndex - 1], first: currentVisitIndex - 1 === 0 })
        }
    }
    catch (err) {
        res.status(500).json({ message: err })
    }
})
app.post('/delete-patient', verifyToken, async (req, res) => {
    try {
        await Patient.findOneAndUpdate({ "email": req.body.email }, { $set: { "is_active": false } })
        res.status(200).json({ message: "Successfully deleted" })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ err })
    }
})
app.post('/edit-patient', verifyToken, async (req, res) => {
    try {
        let date = new Date()
        const user1 = await Patient.findOne({ "email": req.body.email });
        await Patient.findOneAndUpdate({ "email": req.body.email }, {
            $set: {
                "first_name": req.body.new_firstName, "last_name": req.body.new_lastName, "email": req.body.new_email,
                "telephone": req.body.new_telephone, "gender": req.body.gender, "date_of_birth": req.body.new_dob, "reference_dob_for_age": req.body.new_ref_dob,
                "guardian_first_name": req.body.new_guardian_first_name, "guardian_last_name": req.body.new_guardian_last_name, "guardian_relationship": req.body.new_guardian_relationship,
                "address": req.body.new_address, "modified_on": date.toUTCString(), "modified_by": req.body.modified_by
            }
        });
        if (user1) {
            res.status(200).json({ message: "Successfully updated" });
        } else {
            res.status(404).json({ message: "Item not found" });
        }
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ err })
    }
})
app.put('/upload/image-and-annotations', verifyToken, async (req, res) => {
    const { base64Image, thumbnailBase64, fileName, patientID, imageNumber, scaledResponse, annotationFileName, visitId } = req.body;

    // Extract base64 data
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Buffer.from(base64Data, 'base64');

    // Extract thumbnail base64 data
    const thumbnailData = thumbnailBase64.replace(/^data:image\/\w+;base64,/, "");
    const thumbnailBinaryData = Buffer.from(thumbnailData, 'base64');

    const imagePath = path.join(__dirname, 'AnnotatedFiles', fileName);
    const annotationPath = path.join(__dirname, 'AnnotatedFiles', annotationFileName);
    const thumbnailPath = path.join(__dirname, 'AnnotatedFiles', 'Thumbnail', `T${fileName}`);

    try {
        // Save image
        await fs.promises.writeFile(imagePath, binaryData);

        // Save thumbnail
        await fs.promises.writeFile(thumbnailPath, thumbnailBinaryData);

        // Save annotations
        await fs.promises.writeFile(annotationPath, JSON.stringify(scaledResponse));

        console.log(`Image, thumbnail, and annotations saved for Patient ID: ${patientID}, Image Number: ${imageNumber}`);

        //Save to Database
        const date = new Date();
        const images = new PatientImages({
            "visitId": visitId, "patientId": patientID, "image_url": path.join('AnnotatedFiles', fileName),
            "json_url": path.join('AnnotatedFiles', annotationFileName),
            "thumbnail_url": path.join('AnnotatedFiles', 'Thumbnail', `T${fileName}`), "created_on": date.toUTCString(),
            "is_deleted": false
        })
        await images.save()
        res.status(200).send('Image, thumbnail, and annotations uploaded and saved successfully');
    } catch (err) {
        console.error('Error uploading files:', err);
        res.status(500).send('Error uploading files: ' + err.message);
    }
});
app.post('/upload/coordinates', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { base64Image, thumbnailBase64, visitId, fileName, patientID, imageNumber, annotationFileName } = req.body
        // console.log(req.body)
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const fileBuffer = Buffer.from(base64Image.split(',')[1], 'base64');

        // Create FormData
        const formData = new FormData();

        // Append the buffer as a file
        formData.append('image', fileBuffer, {
            filename: 'image.jpg',  // or whatever extension is appropriate
            contentType: 'image/jpeg'  // or appropriate mime type
        });

        // Send to Flask server
        const response = await axios.post('http://5.161.242.73/coordinates',
            formData,
            {
                headers: {
                    ...formData.getHeaders()
                },
                // Add these to handle larger images
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            }
        );

        // console.log(response.data)
        const scaledResponse = {
            annotations: response.data,
            status: response.data.status,
        };
        const binaryData = Buffer.from(base64Data, 'base64');
        // Extract thumbnail base64 data
        const thumbnailData = thumbnailBase64.replace(/^data:image\/\w+;base64,/, "");
        const thumbnailBinaryData = Buffer.from(thumbnailData, 'base64');
        const imagePath = path.join(__dirname, 'AnnotatedFiles', fileName);
        const annotationPath = path.join(__dirname, 'AnnotatedFiles', annotationFileName);
        const thumbnailPath = path.join(__dirname, 'AnnotatedFiles', 'Thumbnail', `T${fileName}`);
        // Save image
        await fs.promises.writeFile(imagePath, binaryData);
        // Save thumbnail
        await fs.promises.writeFile(thumbnailPath, thumbnailBinaryData);
        // Save annotations
        await fs.promises.writeFile(annotationPath, JSON.stringify(scaledResponse));
        console.log(`Image, thumbnail, and annotations saved for Patient ID: ${patientID}, Image Number: ${imageNumber}`);
        //Save to Database
        const date = new Date();
        const images = new PatientImages({
            "visitId": visitId, "patientId": patientID, "image_url": path.join('AnnotatedFiles', fileName),
            "json_url": path.join('AnnotatedFiles', annotationFileName),
            "thumbnail_url": path.join('AnnotatedFiles', 'Thumbnail', `T${fileName}`), "created_on": date.toUTCString(),
            "is_deleted": false
        })
        await images.save()
        res.status(200).json(response.data);
    }
    catch (error) {
        console.error('Error forwarding image:', error);
        res.status(500).json({
            error: 'Failed to forward image to Flask server',
            details: error.message
        });
    }
});
app.get('/most-recent-image', verifyToken, async (req, res) => {
    const annotatedFilesDir = path.join(__dirname, 'AnnotatedFiles');

    try {
        const files = await fs.promises.readdir(annotatedFilesDir);

        // Filter image files and sort by modification time (most recent first)
        const imageFiles = await Promise.all(files
            .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i))
            .map(async file => {
                const stats = await fs.promises.stat(path.join(annotatedFilesDir, file));
                return { name: file, mtime: stats.mtime };
            }));
        // console.log(imageFiles)
        imageFiles.sort((a, b) => b.mtime - a.mtime);
        if (imageFiles.length === 0) {
            return res.status(404).json({ message: 'No images found' });
        }

        const mostRecentImage = imageFiles[0].name;
        const annotationFileName = mostRecentImage.split('.').slice(0, -1).join('.') + '.json';

        // Read the image file
        const imageBuffer = await fs.promises.readFile(path.join(annotatedFilesDir, mostRecentImage));
        const base64Image = imageBuffer.toString('base64');

        // Read the annotation file
        const annotationData = await fs.promises.readFile(path.join(annotatedFilesDir, annotationFileName), 'utf8');

        res.json({
            image: `data:image/${path.extname(mostRecentImage).slice(1)};base64,${base64Image}`,
            annotations: JSON.parse(annotationData)
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/recent-images', verifyToken, async (req, res) => {
    const limit = parseInt(req.query.limit) || 3;
    const thumbnailDir = path.join(__dirname, 'AnnotatedFiles', 'Thumbnail');

    try {
        const files = await fs.promises.readdir(thumbnailDir);

        // Filter image files and sort by modification time (most recent first)
        const imageFiles = await Promise.all(files
            .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i))
            .map(async file => {
                const stats = await fs.promises.stat(path.join(thumbnailDir, file));
                return { name: file, mtime: stats.mtime };
            }));

        imageFiles.sort((a, b) => b.mtime - a.mtime);

        const recentImages = imageFiles.slice(1, limit + 1); // Exclude the most recent image and limit the results

        // Read each image file and convert to base64
        const imageData = await Promise.all(recentImages.map(async (file) => {
            const imageBuffer = await fs.promises.readFile(path.join(thumbnailDir, file.name));
            const base64Image = imageBuffer.toString('base64');
            return `data:image/${path.extname(file.name).slice(1)};base64,${base64Image}`;
        }));

        res.json({ images: imageData });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/notes-content', verifyToken, async (req, res) => {

    try {

        const notes = await PatientVisits.findOne({ _id: req.query.visitID })

        if (notes) {

            res.status(200).json({ notes: notes.notes })

        }

        else {

            res.status(404).json({ message: "Visit not found" })

        }

    }

    catch (err) {

        console.log(err)

        res.status(500).json({ message: "Internal Server Error" })

    }

})

app.put('/save-notes', verifyToken, async (req, res) => {
    try {
        const notes = await PatientVisits.findOneAndUpdate({ _id: req.body.visitID }, { notes: req.body.notes })
        if (notes) {
            res.status(200).json({ notes: notes.notes })
        }
        else {
            res.status(404).json({ message: "Visit not found" })
        }
    }

    catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal Server Error" })
    }
})

app.put('/save-annotations', verifyToken, async (req, res) => {
    const { patientId, visitId, scaledResponse, imageNumber, annotationPath } = req.body;
    const patientImages = await PatientImages.find({
        "patientId": patientId,
        "visitId": visitId
    })
    // let annotationPath = ''
    // patientImages.forEach(element => {
    //     // console.log(imageNumber, element.json_url.split('_')[2])
    //     if (element.json_url.split('_')[2] === imageNumber.toString()) {
    //         annotationPath = element.json_url;
    //         // console.log(annotationPath)
    //     }
    // });
    try {
        if (annotationPath !== '') {
            await fs.promises.writeFile(annotationPath, JSON.stringify(scaledResponse));
            res.status(200).send('Annotations saved successfully');
        }
        else {
            console.error("Unable to find path")
            res.status(404).send("Unable to find path to save")
        }
    } catch (err) {
        console.error('Error uploading files:', err);
        res.status(500).send('Error uploading files: ' + err.message);
    }
})


app.get('/visitid-images', verifyToken, async (req, res) => {
    try {
        const images = await PatientImages.find({ visitId: req.query.visitID,is_deleted:false });
        // Map through the images and prepare the response for each
        const imageData = await Promise.all(images.map(async (image) => {
            const base64Image = await fs.promises.readFile(image.image_url, 'base64');
            const annotationFilePath = image.image_url.split('.').slice(0, -1).join('.') + '.json';
            const annotationData = await fs.promises.readFile(annotationFilePath, 'utf8');

            return {
                image: `data:image/${path.extname(image.image_url).slice(1)};base64,${base64Image}`,
                annotations: JSON.parse(annotationData),
                name: image.image_url
            };
        }));
        // Return all images and annotations as an array
        res.json({ images: imageData });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//User module
app.post('/user-register', async (req, res) => {
    try {
        if (await User.findOne({ "email": req.body.email })) {
            res.status(409).json({ message: "User is already exist" })
        }
        else {
            const pwd = await bcrypt.hash(req.body.password, 10);
            const user = new User({
                "first_name": req.body.first_name, "last_name": req.body.last_name, "email": req.body.email, "role": req.body.role,
                "password": pwd, "client_id": req.body.client_id
            })
            await user.save()
            res.status(200).json({ message: 'User created successfully' })
        }
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ err })
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ "email": username });
        if (!user) return res.status(404).send('User not found');

        // Check password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).send('Invalid credentials');

        // Generate JWT
        const token = jwt.sign({ id: user._id, lastActivity: Date.now() }, jwtSecretKey, { expiresIn: '12h' });
        const user1 = await User.findOne({ "email": username });
        res.status(200).json({ "token": token, "clientId": user1.client_id });
    } catch (error) {
        res.status(500).send('Server error');
    }
});
//-------------------
app.get('/download-image', verifyToken, (req, res) => {
    const imageName = req.query.imageName; // Get the image file name from the query parameter

    // Define the path to the image in the 'images' folder
    const imagePath = path.join(__dirname, 'AnnotatedFiles', imageName);

    // Set headers to prompt the browser to download the image
    res.setHeader('Content-Disposition', `attachment; filename=${imageName}`);
    res.setHeader('Content-Type', 'image/jpeg'); // You can set this dynamically based on the file type

    // Send the image file to the client
    res.sendFile(imagePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Error downloading the image');
        }
    });
});

function serializeError(error) {
    let seen = new Set();
    return JSON.stringify(error, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            // Circular reference check
            if (seen.has(value)) {
                return '[Circular]';
            }
            seen.add(value);
        }
        return value;
    }, 2); // 2 is for indentation level to make the output readable
}
app.post('/log-error', (req, res) => {
    const { error } = req.body; // The full error object
    // Ensure the logs directory exists
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    const logFilePath = path.join(logDir, 'error.log');
    // Prepare the error log entry
    const timestamp = new Date().toISOString();
    const logMessage = `
      [${timestamp}] ERROR:
      ${serializeError(error)}  
      ----------------------------------------------
    `;
    // Append the error message to the log file
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to log the error' });
        }
        return res.status(200).json({ message: 'Error logged successfully' });
    });
});

app.use('/AnnotatedFiles/Thumbnail', express.static(path.join(__dirname, 'AnnotatedFiles/Thumbnail')));
app.use('/AnnotatedFiles', express.static(path.join(__dirname, 'AnnotatedFiles')));
// Serve static files from the 'public/images' directory
//app.use('/images', express.static(path.join(__dirname, 'AnnotatedFiles/Thumbnail')));

app.listen(3000, () => console.log('Server running on port 3000'));