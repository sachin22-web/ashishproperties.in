import { connectToDatabase, closeDatabaseConnection, getDatabase } from '../db/mongodb';
import { ObjectId } from 'mongodb';

async function run() {
  try {
    await connectToDatabase();
    const db = getDatabase();

    // 1) Pick a property with an owner
    const property = await db.collection('properties').findOne({});
    if (!property) {
      console.error('No property found in DB');
      return;
    }

    const sellerIdRaw = property.ownerId || property.owner || property.seller || property.user || property.ownerId || property.sellerId || property.postedBy;
    const sellerId = sellerIdRaw ? (typeof sellerIdRaw === 'object' ? sellerIdRaw.toString() : String(sellerIdRaw)) : null;

    // 2) Find a buyer user different from seller
    const buyer = await db.collection('users').findOne(sellerId ? { _id: { $ne: new ObjectId(sellerId) } } : {});
    if (!buyer) {
      console.error('No buyer user found in DB');
      return;
    }

    console.log('Using property:', property._id.toString(), 'seller:', sellerId, 'buyer:', buyer._id.toString());

    // 3) Insert an enquiry as buyer
    const enquiryDoc: any = {
      propertyId: property._id.toString(),
      name: buyer.name || 'Test Buyer',
      phone: buyer.phone || '+919999999999',
      message: 'Test enquiry from simulation script',
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'new',
    };

    const enquiryRes = await db.collection('enquiries').insertOne(enquiryDoc);
    console.log('Inserted enquiry id:', enquiryRes.insertedId.toString());

    // 4) Simulate seller replying
    const replyMsg: any = {
      senderId: sellerId || 'seller-sim',
      senderType: 'seller',
      message: 'Automated reply from seller (simulation)',
      createdAt: new Date(),
      isRead: false,
      source: 'seller_reply',
      receiverId: buyer._id,
      receiverPhone: buyer.phone || null,
      propertyId: property._id.toString(),
      enquiryId: enquiryRes.insertedId,
    };

    const msgRes = await db.collection('messages').insertOne(replyMsg);
    console.log('Inserted message id:', msgRes.insertedId.toString());

    // 5) Update enquiry status
    await db.collection('enquiries').updateOne({ _id: enquiryRes.insertedId }, { $set: { status: 'contacted', updatedAt: new Date() } });

    // 6) Fetch messages for buyer
    const buyerMsgs = await db.collection('messages').find({ $or: [ { receiverId: buyer._id }, { receiverPhone: buyer.phone } ] }).sort({ createdAt: -1 }).limit(10).toArray();
    console.log('Buyer messages count (recent):', buyerMsgs.length);
    if (buyerMsgs.length > 0) {
      console.log('Latest message for buyer:', buyerMsgs[0]);
    }

    // 7) Fetch enquiries for property
    const propEnq = await db.collection('enquiries').find({ propertyId: property._id.toString() }).sort({ createdAt: -1 }).limit(5).toArray();
    console.log('Recent enquiries for property:', propEnq.map((e: any) => ({ _id: e._id.toString(), name: e.name, status: e.status })));

    console.log('Simulation complete. Buyer should see the reply on refresh/polling.');
  } catch (e) {
    console.error('Simulation error:', e);
  } finally {
    await closeDatabaseConnection();
  }
}

run();
