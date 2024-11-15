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

        if (error.name === 'TokenExpiredError') {
            // Specific error for token expiration
            return res.status(401).send({ status: 'Error', data: 'Token has expired. Please log in again.' });
        } else if (error.name === 'JsonWebTokenError') {
            // General JWT error
            return res.status(401).send({ status: 'Error', data: 'Invalid token. Please log in again.' });
        }

        // Catch-all for other errors
        res.status(500).send({ status: 'Error', data: 'Something went wrong.' });
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

app.get('/find-users', authenticateToken, async (req, res) => {
    const userId = req.userId; // Get the current user's ID
    const searchQuery = req.query.search || ''; // Get the search query from the request

    if (!searchQuery.trim()) {
        return res.json([]); // Return empty if the query is empty
    }

    try {
        // Search for users who match the search query and exclude the current user
        const users = await User.find({
            _id: { $ne: userId }, // Exclude current user
            $or: [ // Search across multiple fields
                { firstName: { $regex: searchQuery, $options: 'i' } }, // case-insensitive match
                { lastName: { $regex: searchQuery, $options: 'i' } },
                { userName: { $regex: searchQuery, $options: 'i' } },
            ]
        })
            .select('firstName lastName userName profileImage bio joiningDate '); // Select specific fields

        // Apply Fuse.js for fuzzy search on the filtered users
        const fuse = new Fuse(users, {
            keys: ['firstName', 'lastName', 'userName'], // Fields to search
            threshold: 0.3, // Fuzzy matching threshold (lower = stricter)
        });

        // Get the fuzzy search result
        const result = fuse.search(searchQuery);
        const filteredUsers = result.map(item => item.item); // Extract matched users
        res.json(filteredUsers); // Send the filtered users
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
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
            return res.status(200).json({ status: 'friend' }); // Both users are friends
        }
        let status = 'none'; // Default status: no requests exist

        if (sentRequest) {
            status = 'sent'; // The current user has sent a request
        } else if (receivedRequest) {
            status = 'received'; // The current user has received a request
        }

        res.status(200).json({ status });
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
        const receivedRequests = user.buddyRequests.filter(request => request.direction === 'received');

        res.json(receivedRequests); // Send the received requests
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});
