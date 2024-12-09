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
const TrackBook = require("./Schema/TrackBooks");
const Fuse = require('fuse.js');
const http = require("http");
const { Server } = require("socket.io");
const Chat = require("./Schema/ChatDetails");

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

// app.listen(5001, '0.0.0.0', () => {
//     console.log("Node js server started on port 5001");
// });
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
    const { firstName, lastName, userName, email, contactNumber, bio, password, profileImage } = req.body;

    // Trim the input values
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedUserName = userName.trim();
    const trimmedEmail = email.trim();
    const trimmedContactNumber = contactNumber.trim();
    const trimmedPassword = password.trim();
    const trimmedBio = bio.trim();

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
            bio: trimmedBio,
            profileImage: uploadResponse ? uploadResponse.secure_url : ''
        });

        res.status(201).send({ status: 'Success', data: 'User registered' });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).send({ status: 'Error', data: 'Internal server error' });
    }
});

app.post('/edit-profile', authenticateToken, async (req, res) => {
    const { firstName, lastName, userName, email, contactNumber, bio, profileImage } = req.body;
    const userId = req.userId
    // Trim input values
    const trimmedFirstName = firstName ? firstName.trim() : undefined;
    const trimmedLastName = lastName ? lastName.trim() : undefined;
    const trimmedUserName = userName ? userName.trim() : undefined;
    const trimmedEmail = email ? email.trim() : undefined;
    const trimmedContactNumber = contactNumber ? contactNumber.trim() : undefined;
    const trimmedBio = bio ? bio.trim() : undefined;

    if (!userId) {
        return res.status(400).send({ status: 'Error', data: 'UserId is required.' });
    }

    try {
        const existingUser = await User.findOne({
            $or: [
                { email: trimmedEmail, _id: { $ne: userId } },
                { userName: trimmedUserName, _id: { $ne: userId } },
                { contactNumber: trimmedContactNumber, _id: { $ne: userId } }
            ]
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

        // Update the user details
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                firstName: trimmedFirstName,
                lastName: trimmedLastName,
                userName: trimmedUserName,
                email: trimmedEmail,
                contactNumber: trimmedContactNumber,
                bio: trimmedBio,
                profileImage: uploadResponse ? uploadResponse.secure_url : undefined
            },
            { new: true }  // Return the updated user
        );

        if (!updatedUser) {
            return res.status(404).send({ status: 'Error', data: 'User not found' });
        }

        res.status(200).send({ status: 'Success', data: 'User profile updated', user: updatedUser });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).send({ status: 'Error', data: 'Internal server error' });
    }
});


app.post('/login', async (req, res) => {
    const { loginId, password } = req.body;
    const trimmedLoginId = loginId.trim();
    const trimmedPassword = password.trim();

    if (!trimmedLoginId || !trimmedPassword) {
        return res.status(200).send({ status: 'Error', data: 'Login ID and Password are required.' });
    }

    try {
        const user = await User.findOne({
            $or: [{ email: trimmedLoginId }, { userName: trimmedLoginId }]
        });

        if (!user) {
            return res.status(200).send({ status: 'Error', data: 'Account not found. Please check your email or username.' });
        }

        const isMatch = await bcrypt.compare(trimmedPassword, user.password);

        if (!isMatch) {
            return res.status(200).send({ status: 'Error', data: 'Incorrect password. Please try again.' });
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

app.post('/user-data', authenticateToken, async (req, res) => {
    const userId = req.userId; // This is guaranteed to be set by the middleware

    try {
        // Find user by userId
        const user = await User.findById(userId);

        // If no user is found
        if (!user) {
            return res.status(404).json({ status: 'Error', data: 'User not found.' });
        }

        // Return user data if found
        return res.status(200).json({ status: 'Success', data: user });
    } catch (error) {
        // Handle unexpected errors
        console.error("Error while fetching user data:", error);
        return res.status(500).json({ status: 'Error', data: 'Something went wrong on the server.' });
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
        const books = await Book.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(userId) } }, // Match books owned by the user
            {
                $lookup: {
                    from: "UnhookRequests", // The UnhookRequests collection
                    localField: "_id", // Book's ID
                    foreignField: "book", // Book reference in UnhookRequests
                    as: "unhookRequests" // Alias for matched requests
                }
            },
            {
                $addFields: {
                    pendingRequests: {
                        $filter: {
                            input: "$unhookRequests", // Filter unhookRequests
                            as: "request",
                            cond: { $eq: ["$$request.status", "pending"] } // Only include pending requests
                        }
                    },
                    requestCount: {
                        $size: {
                            $filter: {
                                input: "$unhookRequests",
                                as: "request",
                                cond: { $eq: ["$$request.status", "pending"] } // Count only pending requests
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    unhookRequests: 0, // Exclude the unhookRequests array if not needed
                    pendingRequests: 0 // Exclude filtered requests array if not needed
                }
            }
        ]);

        if (books.length === 0) {
            return res.status(200).send({ status: 'Success', data: [], message: 'No books found for this user.' });
        }

        res.status(200).send({ status: 'Success', data: books });
    } catch (error) {
        console.error("Fetch books error:", error);
        res.status(500).send({ status: 'Error', data: 'Internal server error' });
    }
});

app.post("/update-return-status", async (req, res) => {
    const { bookId, returnStatus } = req.body;

    // Validate the request body
    if (!bookId || !returnStatus) {
        return res.status(400).json({ message: "bookId and returnStatus are required" });
    }

    // Check for valid returnStatus
    if (!["requested", "accepted", "confirmed"].includes(returnStatus)) {
        return res.status(400).json({ message: "Invalid returnStatus value" });
    }

    try {
        // Find the book by ID and update the returnStatus
        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        // Update the returnStatus field
        book.returnStatus = returnStatus;

        // Save the updated book
        await book.save();

        return res.status(200).json({ message: "Return status updated successfully" });
    } catch (error) {
        console.error("Error updating return status:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.post('/hooked-books', authenticateToken, async (req, res) => {
    const userId = req.userId;
    try {

        const currentUser = await User.findById(userId);

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
        const book = await Book.findById(bookId);
        if (book) {
            // Set the returnStatus to 'requested' when a new request is made
            book.returnStatus = 'none';

            // Initialize returnConfirmation to indicate both parties have not confirmed
            book.returnConfirmation = {
                requesterConfirmed: false,
                ownerConfirmed: false
            };

            await book.save();
        }
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
            .populate('book', 'title bookThumbnail returnStatus returnConfirmation') // Get book details (like title and thumbnail)
            .populate('owner', 'userName profileImage'); // Get owner details (like name and profile image)

        if (!unhookRequests.length) {
            return res.status(200).send({ status: 'Success', data: [], message: 'No unhook requests found for this user.' });
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

app.post('/delete-unhook-request', async (req, res) => {
    const { requestId } = req.body;

    if (!requestId) {
        return res.status(400).json({ message: 'Request ID is required.' });
    }

    try {
        const unhookRequest = await UnhookRequest.findById(requestId);

        if (!unhookRequest) {
            return res.status(404).json({ message: 'Unhook request not found.' });
        }

        // Check if the request status is already processed
        if (unhookRequest.status !== 'pending') {
            return res.status(400).json({ message: 'This request has already been processed and cannot be deleted.' });
        }

        // Delete the unhook request
        await unhookRequest.deleteOne();

        res.status(200).json({ message: 'Unhook request deleted successfully.' });
    } catch (error) {
        console.error('Error deleting unhook request:', error);
        res.status(500).json({ message: 'Failed to delete unhook request.' });
    }
});

app.post('/confirm-return-status', async (req, res) => {
    const { bookId, returnStatus, requesterConfirmed } = req.body;
    try {
        // Find the book and update the return status and requester confirmation
        const book = await Book.findByIdAndUpdate(
            bookId,
            {
                returnStatus: returnStatus,
                'returnConfirmation.requesterConfirmed': requesterConfirmed, // Set requesterConfirmed to true
            },
            { new: true } // Return the updated book
        );

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.status(200).json(book);
    } catch (error) {
        console.error('Error confirming return status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/confirm-receive-return-status', async (req, res) => {
    const { bookId, returnStatus, ownerConfirmed, requestId } = req.body;
    try {
        // Find the book and update the return status and requester confirmation
        const request = await UnhookRequest.findByIdAndUpdate(requestId, {
            status: 'returned'
        })
        const book = await Book.findByIdAndUpdate(
            bookId,
            {
                returnStatus: returnStatus,
                HookStatus: 'hooked',
                'returnConfirmation.ownerConfirmed': ownerConfirmed, // Set requesterConfirmed to true
            },
            { new: true } // Return the updated book
        );

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.status(200).json(book);
    } catch (error) {
        console.error('Error confirming return status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/add-trackbook', authenticateToken, async (req, res) => {
    const {
        title,
        author,
        bookStatus,
        bookThumbnail,
        categories,
        dateCompleted,
        isbn10,
        isbn13,
        review,
        source,
        startDate,
        visibility
    } = req.body;

    const userId = req.userId;  // Assuming the user is authenticated

    try {
        // Create a new TrackBook document
        const newTrackBook = new TrackBook({
            title,
            author,
            isbn10,
            isbn13,
            bookThumbnail,
            categories,
            book: null,  // Since it's not being fetched from a BookInfo reference in the payload
            BookStatus: bookStatus,  // Default to 'reading' if not provided
            createdAt: Date.now(),
            startDate: startDate ? new Date(startDate) : null,
            dateCompleted: dateCompleted ? new Date(dateCompleted) : null,
            source: source || 'Other',  // Default to 'External' if not provided
            review,
            visibility: visibility,
            owner: userId  // Assuming the owner (user) is the authenticated user
        });

        // Save to the database
        await newTrackBook.save();

        res.status(201).json({ status: 'Success', data: 'TrackBook entry created successfully' });
    } catch (error) {
        console.error("TrackBook creation error:", error);
        res.status(500).json({ status: 'Error', data: 'Internal server error' });
    }
});


app.get('/get-trackbooks', authenticateToken, async (req, res) => {
    const userId = req.userId;  // Assuming you store userId in the token payload
    // const { bookStatus, source } = req.query; // Optional filters from query parameters

    try {
        // Build the query
        let query = { owner: userId }; // Filter by the current user

        // Add filters if provided
        // if (bookStatus) {
        //     query.BookStatus = bookStatus;
        // }
        // if (source) {
        //     query.source = source;
        // }

        // Fetch the books from the database based on the query
        const trackBooks = await TrackBook.find(query).populate('book'); // Populate additional book info if needed

        // if (!trackBooks.length) {
        //     return res.status(404).send({ status: 'Error', data: 'No books found for tracking' });
        // }

        if (!trackBooks.length) {
            return res.status(200).send({ status: 'Success', data: [], message: 'No books found for tracking' });
        }

        res.status(200).send({ status: 'Success', data: trackBooks });
    } catch (error) {
        console.error("Error fetching track books:", error);
        res.status(500).send({ status: 'Error', data: 'Internal server error' });
    }
});


app.post('/update-trackbook-status', authenticateToken, async (req, res) => {
    const { trackBookId, bookStatus, dateStarted, dateCompleted, review, visibility } = req.body;  // trackBookId is now part of the request body
    const userId = req.userId;  // Assuming the user is authenticated

    try {
        // Find the TrackBook by ID and owner (to ensure only the owner can update their track)
        const trackBook = await TrackBook.findOne({ _id: trackBookId, owner: userId });

        if (!trackBook) {
            return res.status(404).json({ status: 'Error', data: 'TrackBook not found or you are not authorized to update this entry' });
        }

        // Update the book status and optionally the completion date
        trackBook.BookStatus = bookStatus || trackBook.BookStatus;  // Update status if provided
        if (bookStatus === 'completed' && dateCompleted) {
            trackBook.readCount += 1;
            trackBook.dateCompleted = new Date(dateCompleted);  // Update dateCompleted if status is 'completed' and date provided
        } else if (bookStatus !== 'completed') {
            trackBook.dateCompleted = null;  // Reset dateCompleted if the book is not completed
        }

        // Only update review if it's neither null nor an empty string
        if (review !== null && review !== "") {
            trackBook.review = review;
        }

        if (dateCompleted !== null && dateCompleted !== "") {
            trackBook.dateCompleted = dateCompleted;
        }

        if (dateStarted !== null && dateStarted !== "") {
            trackBook.startDate = dateStarted;
        }

        if (visibility !== null && visibility !== "") {
            trackBook.visibility = visibility;
        }


        // Save the updated trackBook
        await trackBook.save();

        res.status(200).json({ status: 'Success', data: 'TrackBook status updated successfully' });
    } catch (error) {
        console.error("TrackBook update error:", error);
        res.status(500).json({ status: 'Error', data: 'Internal server error' });
    }
});


function getLevenshteinDistance(a, b) {
    const matrix = [];

    // Ensure a is the shorter string
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
        }
    }

    return matrix[b.length][a.length];
}


app.get('/find-users', authenticateToken, async (req, res) => {
    const userId = req.userId; // Get the current user's ID
    const searchQuery = req.query.search || ''; // Get the search query from the request

    if (!searchQuery.trim()) {
        return res.json([]); // Return empty if the query is empty
    }

    try {
        // Fetch users excluding the current user
        const users = await User.find({
            _id: { $ne: userId }, // Exclude current user
        }).select('firstName lastName userName profileImage bio joiningDate '); // Select specific fields

        // Normalize the search query to lowercase for comparison
        const normalizedQuery = searchQuery.toLowerCase();

        // Set a Levenshtein distance threshold
        const maxDistance = 2; // You can adjust this threshold based on how lenient you want the search to be

        const matchedUsers = users.filter(user => {
            // Check the distance between the search query and each field (firstName, lastName, userName)
            const distanceFirstName = getLevenshteinDistance(normalizedQuery, user.firstName.toLowerCase());
            const distanceLastName = getLevenshteinDistance(normalizedQuery, user.lastName.toLowerCase());
            const distanceUserName = getLevenshteinDistance(normalizedQuery, user.userName.toLowerCase());

            // If any of the distances are below the threshold, consider the user a match
            return (
                distanceFirstName <= maxDistance ||
                distanceLastName <= maxDistance ||
                distanceUserName <= maxDistance
            );
        });

        res.json(matchedUsers); // Return the matched users
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

app.get("/my-buddies", async (req, res) => {
    const { userId } = req.query;

    try {
        const user = await User.findById(userId).populate({
            path: "buddies",
            select: "userName firstName lastName profileImage",
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Respond with the buddies' details
        res.json({ buddies: user.buddies });
    } catch (error) {
        console.error("Error fetching buddies:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



app.post('/buddy-hooked-books', async (req, res) => {
    const { userId } = req.body;

    // Validate userId
    if (!userId) {
        return res.status(400).send({
            status: 'Error',
            data: 'userId is required.'
        });
    }

    try {
        // Fetch hooked books for the specified userId
        const userHookedBooks = await Book.find({
            owner: userId,
            HookStatus: 'hooked'
        }).exec();

        // For each book, get the count of unhook requests
        const booksWithRequestCounts = await Promise.all(userHookedBooks.map(async (book) => {
            const requestCount = await UnhookRequest.countDocuments({ book: book._id });
            return {
                ...book.toObject(),  // Convert the book document to a plain object
                requestCount,        // Add the request count
            };
        }));

        // Count the total number of books that are hooked
        const totalHookedBooks = await Book.countDocuments({ owner: userId });

        // Count the total number of accepted unhook requests
        const totalAcceptedUnhooks = await UnhookRequest.countDocuments({
            requester: userId,
            status: 'accepted'
        });

        res.status(200).send({
            status: 'Success',
            data: {
                booksWithRequestCounts,
                totalHookedBooks,      // Total number of hooked books
                totalAcceptedUnhooks,  // Total number of accepted unhooks
            },
        });
    } catch (error) {
        console.error("Error fetching hooked books:", error);
        res.status(500).send({
            status: 'Error',
            data: 'An error occurred while fetching hooked books.',
        });
    }
});

app.post('/send-buddy-request', authenticateToken, async (req, res) => {
    const senderId = req.userId; // Extract sender ID from token
    const { recipientId } = req.body; // Extract recipient ID from request body

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(recipientId)) {
        return res.status(400).json({ message: 'Invalid user IDs provided' });
    }

    if (senderId === recipientId) {
        return res.status(400).json({ message: 'You cannot send a buddy request to yourself' });
    }

    try {
        // Check if the recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        // Check if the sender exists
        const sender = await User.findById(senderId);
        if (!sender) {
            return res.status(404).json({ message: 'Sender not found' });
        }

        // Check if a buddy request already exists (sent or received)
        const recipientRequestExists = recipient.buddyRequests.some(
            (request) =>
                request.userId.toString() === senderId &&
                request.status === 'pending' &&
                request.direction === 'received'
        );

        const senderRequestExists = sender.buddyRequests.some(
            (request) =>
                request.userId.toString() === recipientId &&
                request.status === 'pending' &&
                request.direction === 'sent'
        );

        if (recipientRequestExists || senderRequestExists) {
            return res.status(400).json({ message: 'Buddy request already exists' });
        }

        // Add the buddy request to the recipient's `buddyRequests` array
        recipient.buddyRequests.push({
            userId: senderId,
            status: 'pending',
            direction: 'received',
        });

        // Save the recipient's data
        await recipient.save();

        // Add the buddy request to the sender's `buddyRequests` array
        sender.buddyRequests.push({
            userId: recipientId,
            status: 'pending',
            direction: 'sent',
        });

        // Save the sender's data
        await sender.save();

        res.status(200).json({ message: 'Buddy request sent successfully' });
    } catch (error) {
        console.error('Error sending buddy request:', error);
        res.status(500).json({ message: 'Error sending buddy request' });
    }
});

app.post('/check-buddy-request-status', authenticateToken, async (req, res) => {
    const { userId } = req.body; // The ID of the user to check against
    const senderId = req.userId; // The ID of the current authenticated user

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(senderId)) {
        return res.status(400).json({ message: 'Invalid user IDs provided' });
    }

    if (userId === senderId) {
        return res.status(400).json({ message: 'Cannot check request status for yourself' });
    }

    try {
        const sender = await User.findById(senderId);
        const recipient = await User.findById(userId);
        const buddiesLength = recipient.buddies.length;
        if (!sender || !recipient) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if there is a pending request sent by the current user
        const sentRequest = sender.buddyRequests.find(
            (request) => request.userId.toString() === userId && request.status === 'pending' && request.direction === 'sent'
        );

        // Check if there is a pending request sent by the other user (received)
        const receivedRequest = sender.buddyRequests.find(
            (request) => request.userId.toString() === userId && request.status === 'pending' && request.direction === 'received'
        );
        const isFriend = sender.buddies.includes(userId) && recipient.buddies.includes(senderId);

        // If they are already friends, return the appropriate status
        if (isFriend) {
            return res.status(200).json({ status: 'friend', buddiesLength }); // Both users are friends
        }
        let status = 'none'; // Default status: no requests exist

        if (sentRequest) {
            status = 'sent'; // The current user has sent a request
        } else if (receivedRequest) {
            status = 'received'; // The current user has received a request
        }

        res.status(200).json({ status, buddiesLength });
    } catch (error) {
        console.error('Error checking buddy request status:', error);
        res.status(500).json({ message: 'Error checking buddy request status' });
    }
});


app.delete('/delete-buddy-request', authenticateToken, async (req, res) => {
    const userId = req.userId; // Extract user ID from token
    const { recipientId } = req.body; // Extract recipient ID from request body

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(recipientId)) {
        return res.status(400).json({ message: 'Invalid user IDs provided' });
    }

    if (userId === recipientId) {
        return res.status(400).json({ message: 'You cannot delete a buddy request to yourself' });
    }

    try {
        // Find both users
        const sender = await User.findById(userId);
        const recipient = await User.findById(recipientId);

        if (!sender || !recipient) {
            return res.status(404).json({ message: 'User not found' });
        }


        // Remove the buddy request from the recipient's `buddyRequests` array
        recipient.buddyRequests = recipient.buddyRequests.filter(
            (request) =>
                request.userId.toString() !== userId.toString() || request.status !== 'pending'
        );
        await recipient.save();


        // Remove the buddy request from the sender's `buddyRequests` array
        sender.buddyRequests = sender.buddyRequests.filter(
            (request) =>
                request.userId.toString() !== recipientId.toString() || request.status !== 'pending'
        );
        await sender.save();


        res.status(200).json({ message: 'Buddy request deleted successfully' });
    } catch (error) {
        console.error('Error deleting buddy request:', error);
        res.status(500).json({ message: 'Error deleting buddy request' });
    }
});


app.post('/accept-buddy-request', authenticateToken, async (req, res) => {
    const { userId } = req.body; // ID of the user whose buddy request is being accepted
    const senderId = req.userId; // ID of the authenticated user (sender)

    // Validate the user IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(senderId)) {
        return res.status(400).json({ message: 'Invalid user IDs provided' });
    }

    if (userId === senderId) {
        return res.status(400).json({ message: 'Cannot accept a request from yourself' });
    }

    try {
        const sender = await User.findById(senderId);
        const recipient = await User.findById(userId);

        if (!sender || !recipient) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Log the buddyRequests to ensure data is correct
        // console.log('Sender buddy requests:', sender.buddyRequests);
        // console.log('Recipient buddy requests:', recipient.buddyRequests);

        // Find the received buddy request (request sent by the sender to the recipient)
        const receivedRequestIndex = recipient.buddyRequests.findIndex(
            (request) => request.userId.toString() === senderId.toString() && request.status === 'pending' && request.direction === 'sent'
        );

        // Find the sent buddy request (request sent by the recipient to the sender)
        const sentRequestIndex = sender.buddyRequests.findIndex(
            (request) => request.userId.toString() === userId.toString() && request.status === 'pending' && request.direction === 'received'
        );

        // Log the indexes to verify if they are being found
        // console.log('Received request index:', receivedRequestIndex);
        // console.log('Sent request index:', sentRequestIndex);

        // If either request doesn't exist, return an error
        if (receivedRequestIndex === -1) {
            return res.status(400).json({ message: 'Received buddy request not found or already processed' });
        }
        if (sentRequestIndex === -1) {
            return res.status(400).json({ message: 'Sent buddy request not found or already processed' });
        }

        // Update the status of the requests to 'accepted'
        recipient.buddyRequests[receivedRequestIndex].status = 'accepted';
        sender.buddyRequests[sentRequestIndex].status = 'accepted';

        // Add each other to the buddies list
        recipient.buddies.push(sender._id);
        sender.buddies.push(recipient._id);

        // Save both users
        await recipient.save();
        await sender.save();

        // Respond with success
        res.status(200).json({ message: 'Buddy request accepted successfully' });
    } catch (error) {
        console.error('Error accepting buddy request:', error);
        res.status(500).json({ message: 'Error accepting buddy request' });
    }
});



app.post('/get-buddy-trackbooks', async (req, res) => {
    const { userId } = req.body;

    try {
        // Query for books owned by the user and marked as public
        let query = { owner: userId, visibility: 'public' };

        const trackBooks = await TrackBook.find(query).populate('book'); // Populate additional book info if needed

        if (!trackBooks.length) {
            return res.status(200).send({ status: 'Success', data: [], message: 'No books found for tracking' });
        }

        res.status(200).send({ status: 'Success', data: trackBooks });
    } catch (error) {
        console.error("Error fetching track books:", error);
        res.status(500).send({ status: 'Error', data: 'Internal server error' });
    }
});


app.get('/get-users-requests', authenticateToken, async (req, res) => {
    const userId = req.userId; // Get the current user's ID
    try {
        // Find the current user and populate the buddyRequests array
        const user = await User.findById(userId)
            .select('buddyRequests') // Only select the buddyRequests field
            .populate('buddyRequests.userId', 'firstName lastName userName profileImage bio') // Populate the userId field with the details of the user who sent the request

        // Filter the buddy requests to only include those that are received
        const receivedRequests = user.buddyRequests.filter(request => request.direction === 'received' && request.status === 'pending');

        res.json(receivedRequests); // Send the received requests
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});



const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE"],
    },
});
// Socket.io connection for real-time communication


server.listen(5001, '0.0.0.0', () => {
    console.log("Server with Socket.io running on port 5001");
});
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_chat", (chatId) => {
        socket.join(chatId);
        console.log(`User joined chat: ${chatId}`);
    });

    socket.on('typing', (data) => {
        if (data.chatId) {
            socket.to(data.chatId).emit('typing', data); // Emit to everyone except the sender
        } else {
            console.log('No chatId provided in typing event');
        }
    });

    // Emit 'stop_typing' event to others in the chat
    socket.on('stop_typing', (data) => {
        if (data.chatId) {
            socket.to(data.chatId).emit('stop_typing', data); // Emit to everyone except the sender
        } else {
            console.log('No chatId provided in stop_typing event');
        }
    });

    // socket.on("send_message", (data) => {
    //     io.to(data.chatId).emit("receive_message", data);
    //     console.log("Message sent:", data);
    // });

    socket.on("read_receipt", async (data) => {
        const { chatId, messageId, userId } = data;
        try {
            // Find the chat and the specific message
            const chat = await Chat.findById(chatId);

            if (!chat) {
                return socket.emit("error", { message: "Chat not found" });
            }

            const message = chat.messages.id(messageId);
            if (!message) {
                return socket.emit("error", { message: "Message not found" });
            }

            // Check if the message is already read
            if (message.isRead) {
                return;
            }

            // Mark the message as read
            message.isRead = true;
            await chat.save();

            // Decrement the unread count for the user who read the message
            const currentUnreadCount = chat.unreadCount.get(userId) || 0;
            if (currentUnreadCount > 0) {
                chat.unreadCount.set(userId, 0);
                await chat.save();
            }

            // Emit the read receipt to all participants in the chat
            io.to(chatId).emit("message_read", {
                messageId,
                userId,  // Sender of the read receipt
                isRead: true,
                updatedAt: message.updatedAt,
            });

            console.log(`Message ${messageId} marked as read by ${userId}`);
        } catch (error) {
            console.error("Error marking message as read:", error);
            socket.emit("error", { message: "Failed to update read receipt" });
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

app.get('/chat-api/chats', authenticateToken, async (req, res) => {
    const userId = req.userId;
    try {
        const chats = await Chat.find({ participants: userId, 'lastMessage.text': { $exists: true } })
            .populate('participants', 'userName profileImage') // Get user details
            .select('lastMessage participants unreadCount')
            .sort({ 'lastMessage.timestamp': -1 }); // Sort by latest lastMessage timestamp in descending order

        if (!chats.length) {
            return res.status(200).send({ status: 'Success', data: [], message: 'No chats found.' });
        }

        res.status(200).send({ status: 'Success', data: chats });
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).send({ status: 'Error', data: 'Internal server error' });
    }
});


app.get('/chat-api/chats/:chatId', authenticateToken, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate('participants', '_id')
            .populate({
                path: 'messages',
                model: 'Message',
                populate: {
                    path: 'sender',
                    model: 'UserInfo', // Populate sender details for each message
                    select: '_id',
                },
            });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Reverse the order of the messages to show the newest messages first
        // chat.messages.reverse();



        res.status(200).json({ data: chat });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching chat details' });
    }
});



// Route to send a new message to a chat
app.post('/chat-api/chats/:chatId/messages', authenticateToken, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { text } = req.body;
        const sender = req.userId; // Current user's ID from the token

        // Find the chat by its ID
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).send({ message: 'Chat not found.' });
        }

        if (!chat.participants.includes(sender)) {
            return res.status(403).send({ message: 'You are not a participant in this chat.' });
        }

        // Create a new message
        const message = {
            sender, // Include sender ID
            text,
            timestamp: new Date(),
        };

        // Add the message to the start of the messages array
        chat.messages.unshift(message);
        chat.lastMessage = {
            text,
            sender,  // Add sender to lastMessage
            timestamp: new Date(),
        };

        // Increment unread count for all participants except the sender
        chat.participants.forEach((participant) => {
            if (participant.toString() !== sender.toString()) {
                chat.unreadCount.set(participant.toString(), (chat.unreadCount.get(participant.toString()) || 0) + 1);
            }
        });

        // Save the chat with the new message
        await chat.save();

        // Retrieve the newly added message (first one in the array now) to include the `_id`
        const newMessage = chat.messages[0];

        // Emit the new message to the socket for real-time updates
        io.to(chatId).emit('receive_message', { lastMessage: chat.lastMessage, unreadCount: chat.unreadCount, newMessage });

        // Respond with the new message
        res.status(200).send({ data: newMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
});


app.get('/user-api/current', authenticateToken, async (req, res) => {
    const userId = req.userId; // Get the userId from the authenticated token

    try {
        // Find the user by userId
        const user = await User.findById(userId).select('firstName lastName userName');

        if (!user) {
            return res.status(404).send({ status: 'Error', message: 'User not found' });
        }

        res.status(200).send({ status: 'Success', data: user });
    } catch (error) {
        console.error('Error fetching current user details:', error);
        res.status(500).send({ status: 'Error', message: 'Internal server error' });
    }
});

app.get('/chat-api/get-chats/:userId', authenticateToken, async (req, res) => {
    const currentUserId = req.userId;  // Get the authenticated user ID from the token
    const otherUserId = req.params.userId;  // Get the other user's ID from the URL params

    if (currentUserId === otherUserId) {
        return res.status(400).json({ error: "You can't chat with yourself." });
    }

    try {
        // Check if a chat already exists between the two users
        let chat = await Chat.findOne({
            participants: { $all: [currentUserId, otherUserId] },  // Match both users in the participants array
        });

        if (chat) {
            // Chat exists, return the chatId
            return res.status(200).json({ chatId: chat._id });
        }

        // No chat exists, create a new chat
        const newChat = new Chat({
            participants: [currentUserId, otherUserId],
            messages: [],  // Start with an empty messages array
            lastMessage: null,  // No last message yet
            unreadCount: {
                [currentUserId]: 0,  // Initialize unread count for both users
                [otherUserId]: 0,
            },
        });

        await newChat.save();

        // Return the new chatId
        return res.status(201).json({ chatId: newChat._id });

    } catch (error) {
        console.error('Error fetching or creating chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.delete('/chats/:chatId/messages/:messageId', authenticateToken, async (req, res) => {
    const { chatId, messageId } = req.params;
    const userId = req.userId; // Get the logged-in user from authentication

    try {
        // Find the chat and the message
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        // Find the message within the chat
        const message = chat.messages.id(messageId);



        await message.deleteOne();
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You can only delete your own messages' });
        }
        if (chat.messages.length === 0) {
            // No messages left, clear the lastMessage field
            chat.lastMessage = {};
        }
        // Save the chat after deletion
        await chat.save();

        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});