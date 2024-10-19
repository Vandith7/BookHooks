const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcrypt');
const User = require('./Schema/UserDetails');
const Book = require('./Schema/BookDetails')
const UnhookRequest = require('./Schema/UnhookRequest')
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleWare/authMiddleWare');
const fs = require('fs');
const sharp = require('sharp');


require('dotenv').config();

const mongoUrl = process.env.MONGO_URL;
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const jwt_secret_key = process.env.JWT_SECRET_KEY;

app.use(cors({
    methods: ["POST", "GET", "DELETE"],
    credentials: true,
    origin: '*'
}));

app.use(express.json({ limit: '10mb' })); // Increase limit as needed
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.listen(5001, '0.0.0.0', () => {
    console.log("Node js server started on port 5001");
});
mongoose.connect(mongoUrl)
    .then(() => {
        console.log("Database connected");
    })
    .catch((e) => {
        console.log("Database connection error: ", e);
    });

app.get('/', (req, res) => {
    res.send({ status: "Success" });
});

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
});

app.post('/register', async (req, res) => {
    const { firstName, lastName, userName, email, contactNumber, password, profileImage } = req.body;

    // Trim the input values
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedUserName = userName.trim();
    const trimmedEmail = email.trim();
    const trimmedContactNumber = contactNumber.trim();
    const trimmedPassword = password.trim();

    if (!userName || !email || !contactNumber) {
        return res.status(400).send({ status: 'Error', data: 'UserName, Email, and Contact Number are required.' });
    }

    try {
        const existingUser = await User.findOne({
            $or: [{ email: trimmedEmail }, { userName: trimmedUserName }, { contactNumber: trimmedContactNumber }]
        });

        if (existingUser) {
            if (existingUser.email === trimmedEmail) {
                return res.status(400).send({ status: 'Error', data: 'Email already exists' });
            }
            if (existingUser.userName === trimmedUserName) {
                return res.status(400).send({ status: 'Error', data: 'User name already exists' });
            }
            if (existingUser.contactNumber === trimmedContactNumber) {
                return res.status(400).send({ status: 'Error', data: 'Contact number already in use' });
            }
        }

        let uploadResponse = null;
        if (profileImage) {
            const base64Data = profileImage.split(';base64,').pop();
            const imgFormat = profileImage.split(';')[0].split('/')[1];

            uploadResponse = await cloudinary.uploader.upload(`data:image/${imgFormat};base64,${base64Data}`, {
                folder: "user_profiles",
                resource_type: "image"
            });
        }

        const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

        // Save the user with the Cloudinary URL
        await User.create({
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            userName: trimmedUserName,
            email: trimmedEmail,
            contactNumber: trimmedContactNumber,
            password: hashedPassword,
            profileImage: uploadResponse ? uploadResponse.secure_url : ''
        });

        res.status(201).send({ status: 'Success', data: 'User registered' });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).send({ status: 'Error', data: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    const { loginId, password } = req.body;
    const trimmedLoginId = loginId.trim();
    const trimmedPassword = password.trim();

    if (!trimmedLoginId || !trimmedPassword) {
        return res.status(400).send({ status: 'Error', data: 'Login ID and Password are required.' });
    }

    try {
        const user = await User.findOne({
            $or: [{ email: trimmedLoginId }, { userName: trimmedLoginId }]
        });

        if (!user) {
            return res.status(400).send({ status: 'Error', data: 'Account not found. Please check your email or username.' });
        }

        const isMatch = await bcrypt.compare(trimmedPassword, user.password);

        if (!isMatch) {
            return res.status(400).send({ status: 'Error', data: 'Incorrect password. Please try again.' });
        }
        const token = jwt.sign(
            { email: user.email, userName: user.userName },
            jwt_secret_key,
            { expiresIn: '7d' }
        );
        res.status(200).send({ status: 'Success', data: token });



    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send({ status: 'Error', data: 'Internal server error' });
    }
});

app.post('/user-data', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).send({ status: 'Error', data: 'Token is required.' });
    }

    try {
        const decoded = jwt.verify(token, jwt_secret_key);

        const userEmail = decoded.email;
        const userName = decoded.userName;

        const user = await User.findOne({
            $or: [{ email: userEmail }, { userName: userName }]
        });

        if (!user) {
            return res.status(404).send({ status: 'Error', data: 'User not found.' });
        }
        res.status(200).send({ status: 'Success', data: user });
    } catch (error) {
        console.error("Token verification error:", error);
        res.status(401).send({ status: 'Error', data: 'Invalid or expired token.' });
    }
});

app.get('/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Find user by ID and select only the needed fields
        const user = await User.findById(userId).select('firstName userName lastName');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).send({ status: 'Success', data: user });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.post('/add-book', authenticateToken, async (req, res) => {
    const { title, author, description, condition, isFetchedFromGoogle, isbn10, isbn13, bookThumbnail, images, categories, latitude, longitude } = req.body;
    const userId = req.userId;

    if (!Array.isArray(images)) {
        return res.status(400).send({ status: 'Error', data: 'Images should be an array.' });
    }

    try {
        const imageUrls = [];

        // Process each image
        for (const image of images) {
            if (image) {
                // Extract base64 data
                const base64Data = image.uri.split(';base64,').pop();
                const imgFormat = image.uri.split(';')[0].split('/')[1];

                // Resize and compress image using sharp
                const resizedImageBuffer = await sharp(Buffer.from(base64Data, 'base64'))
                    .resize({ width: 800 }) // Resize to width of 800 pixels, maintain aspect ratio
                    .jpeg({ quality: 80 }) // Convert to JPEG and set quality to 80 (for compression)
                    .toBuffer();

                // Upload image to Cloudinary
                const uploadResponse = await cloudinary.uploader.upload(`data:image/jpeg;base64,${resizedImageBuffer.toString('base64')}`, {
                    folder: "book_images",
                    resource_type: "image"
                });

                imageUrls.push(uploadResponse.secure_url);
            } else {
                console.warn('Non-string image detected:', image);
            }
        }
        const newBook = new Book({
            title: title,
            author: author,
            description: description,
            condition: condition,
            isFetchedFromGoogle,
            isbn10: isbn10,
            isbn13: isbn13,
            bookThumbnail: bookThumbnail,
            images: imageUrls,
            categories: categories,
            owner: userId,
            latitude: latitude,
            longitude: longitude

        });

        // Save the new book to the database
        await newBook.save();
        res.status(201).send({ status: 'Success', data: 'Book added successfully' });
    } catch (error) {
        console.error("Add book error:", error);
        res.status(500).send({ status: 'Error', data: 'Internal server error' });
    }
});



app.get('/user-books', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        const books = await Book.find({ owner: userId });

        if (books.length === 0) {
            return res.status(404).send({ status: 'Error', data: 'No books found for this user.' });
        }

        res.status(200).send({ status: 'Success', data: books });
    } catch (error) {
        console.error("Fetch books error:", error);
        res.status(500).send({ status: 'Error', data: 'Internal server error' });
    }
});


app.post('/hooked-books', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).send({ status: 'Error', data: 'Token is required.' });
    }

    try {
        const decoded = jwt.verify(token, jwt_secret_key);

        const userEmail = decoded.email;
        const userName = decoded.userName;

        const currentUser = await User.findOne({
            $or: [{ email: userEmail }, { userName: userName }]
        });

        if (!currentUser) {
            return res.status(404).send({ status: 'Error', data: 'User not found.' });
        }

        // Fetch hooked books owned by other users
        const otherUserHookedBooks = await Book.find({
            owner: { $ne: currentUser._id },
            HookStatus: 'hooked'
        }).exec();

        // For each book, get the count of unhook requests
        const booksWithRequestCounts = await Promise.all(otherUserHookedBooks.map(async (book) => {
            const requestCount = await UnhookRequest.countDocuments({ book: book._id });
            return {
                ...book.toObject(),  // Convert the book document to a plain object
                requestCount,        // Add the request count
            };
        }));

        res.status(200).send({
            status: 'Success',
            data: booksWithRequestCounts,
        });
    } catch (error) {
        console.error("Token verification error:", error);
        res.status(401).send({ status: 'Error', data: 'Invalid or expired token.' });
    }
});



app.post('/unhook-request', async (req, res) => {
    const { bookId, requesterId, ownerId } = req.body;
    try {
        const unhookRequest = new UnhookRequest({
            book: bookId,
            requester: requesterId,
            owner: ownerId
        });

        await unhookRequest.save();
        res.status(201).json({ message: 'Unhook request sent successfully.' });
    } catch (error) {
        console.error('Error creating unhook request:', error);
        res.status(500).json({ message: 'Failed to send unhook request.' });
    }
});

app.get('/request-status', async (req, res) => {
    const { bookId, userId } = req.query;

    try {
        const unhookRequest = await UnhookRequest.findOne({ book: bookId, requester: userId, status: 'pending' });
        if (unhookRequest) {
            return res.status(200).json({ isPending: true });
        } else {
            return res.status(200).json({ isPending: false });
        }
    } catch (error) {
        console.error('Error checking request status:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

app.get('/book-requests', async (req, res) => {
    try {
        const { bookId } = req.query;

        // Fetching the unhook requests along with the requester and formatting the createdAt date
        const requests = await UnhookRequest.find({ book: bookId, status: 'pending' })
            .populate('requester', 'userName profileImage') // Populating both userName and profileImage from the requester
            .lean(); // Converts Mongoose documents to plain JavaScript objects

        // Formatting the createdAt date and attaching the formatted date to the response
        requests.forEach(request => {
            request.formattedCreatedAt = new Date(request.createdAt).toLocaleString();
        });

        // Sending the formatted response
        res.json({ requesters: requests });
    } catch (error) {
        console.error('Error fetching book requesters:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/book-requests-accepted', async (req, res) => {
    try {
        const { bookId } = req.query;

        // Fetching the unhook requests along with the requester and formatting the createdAt date
        const requests = await UnhookRequest.find({ book: bookId, status: 'accepted' })
            .populate('requester', 'userName profileImage') // Populating both userName and profileImage from the requester
            .lean(); // Converts Mongoose documents to plain JavaScript objects

        // Formatting the createdAt date and attaching the formatted date to the response
        requests.forEach(request => {
            request.formattedunHookedAt = new Date(request.unHookedAt).toLocaleString();
        });

        // Sending the formatted response
        res.json({ requesters: requests });
    } catch (error) {
        console.error('Error fetching book requesters:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.get('/user-unhooks', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        // Find all unhook requests made by the user and populate book and owner details
        const unhookRequests = await UnhookRequest.find({ requester: userId })
            .populate('book', 'title bookThumbnail') // Get book details (like title and thumbnail)
            .populate('owner', 'userName profileImage'); // Get owner details (like name and profile image)

        if (!unhookRequests.length) {
            return res.status(404).send({ status: 'Error', data: 'No unhook requests found for this user.' });
        }

        res.status(200).send({ status: 'Success', data: unhookRequests });
    } catch (error) {
        console.error("Fetch unhook requests error:", error);
        res.status(500).send({ status: 'Error', data: 'Internal server error' });
    }
});

app.post('/delete-unhook-request', async (req, res) => {
    const { requestId } = req.body; // Get requestId from the request body
    try {
        const unhookRequest = await UnhookRequest.findByIdAndDelete(requestId); // Use requestId here

        if (!unhookRequest) {
            return res.status(404).json({ message: 'Unhook request not found.' });
        }

        res.status(200).json({ message: 'Unhook request deleted successfully.' });
    } catch (error) {
        console.error('Error deleting unhook request:', error);
        res.status(500).json({ message: 'Failed to delete unhook request.' });
    }
});

app.post('/accept-unhook-request', async (req, res) => {
    const { requestId } = req.body;

    if (!requestId) {
        return res.status(400).json({ message: 'Request ID is required.' });
    }

    try {
        const unhookRequest = await UnhookRequest.findById(requestId).populate('book');

        if (!unhookRequest) {
            return res.status(404).json({ message: 'Unhook request not found.' });
        }

        if (unhookRequest.status !== 'pending') {
            return res.status(400).json({ message: 'This request has already been processed.' });
        }

        // Update unhook request status and unHookedAt date
        unhookRequest.status = 'accepted';
        unhookRequest.unHookedAt = new Date();
        await unhookRequest.save();

        // Find and update the book's hook status
        const book = await Book.findById(unhookRequest.book._id);
        if (book) {
            book.HookStatus = 'unhooked';
            await book.save();
        } else {
            return res.status(404).json({ message: 'Book not found.' });
        }

        res.status(200).json({ message: 'Unhook request accepted and book status updated to unhooked.' });
    } catch (error) {
        console.error('Error accepting unhook request:', error);
        res.status(500).json({ message: 'Failed to accept unhook request and update book status.' });
    }
});
