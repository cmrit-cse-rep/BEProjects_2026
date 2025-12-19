import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const user = await User.findById(session.user.id).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, image } = req.body;

      const user = await User.findByIdAndUpdate(
        session.user.id,
        { name, image },
        { new: true, runValidators: true }
      ).select('-password');

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

