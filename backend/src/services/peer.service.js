import { prisma } from '../config/db.js';

export const PeerService = {
  async getRecommendedPeers(userId) {
    const emailKey = userId.trim().toLowerCase();

    // 1. Get current user's profile
    const currentUser = await prisma.profile.findUnique({
      where: { id: emailKey },
      include: { programme: true, courses: true }
    });

    const userProgrammeId = currentUser?.programmeId;
    const userProgrammeName = currentUser?.programmeName || currentUser?.programme?.name;
    const userYear = currentUser?.year;
    const userCourseCodes = (currentUser?.courses || []).map(c => c.code.trim().toUpperCase());

    // 2. Fetch all other profiles (public directory users except current user)
    const candidateProfiles = await prisma.profile.findMany({
      where: {
        id: { not: emailKey },
        isPublic: true,
        publicProfileEnabled: true
      },
      include: {
        programme: true,
        courses: true
      }
    });

    // 3. Fetch current user's friendship/follow records
    const userFriendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: emailKey },
          { receiverId: emailKey }
        ]
      }
    });

    // 4. Calculate similarity scores and enrich candidate metadata
    const rankedPeers = candidateProfiles.map(peer => {
      let matchScore = 0;
      const matchReasons = [];

      const peerProgrammeId = peer.programmeId;
      const peerProgrammeName = peer.programmeName || peer.programme?.name;

      // Priority 1: Same Programme (+100)
      if (userProgrammeId && peerProgrammeId && userProgrammeId === peerProgrammeId) {
        matchScore += 100;
        matchReasons.push(`Same Programme: ${peerProgrammeName || 'Enrolled'}`);
      } else if (userProgrammeName && peerProgrammeName && userProgrammeName.toLowerCase() === peerProgrammeName.toLowerCase()) {
        matchScore += 100;
        matchReasons.push(`Same Programme: ${peerProgrammeName}`);
      }

      // Priority 2: Same Year (+50)
      if (userYear && peer.year && userYear === peer.year) {
        matchScore += 50;
        matchReasons.push(`Same Year: ${peer.year}`);
      }

      // Priority 3: Shared Enrolled Courses (+10 per course)
      const peerCourseCodes = (peer.courses || []).map(c => c.code.trim().toUpperCase());
      const sharedCourses = userCourseCodes.filter(code => peerCourseCodes.includes(code));

      if (sharedCourses.length > 0) {
        matchScore += (sharedCourses.length * 10);
        matchReasons.push(`Shares ${sharedCourses.length} course(s): ${sharedCourses.join(', ')}`);
      }

      // Determine friendship / follow status
      const rel = userFriendships.find(f =>
        (f.senderId === emailKey && f.receiverId === peer.id) ||
        (f.senderId === peer.id && f.receiverId === emailKey)
      );

      let followStatus = 'none';
      let friendshipId = null;
      if (rel) {
        friendshipId = rel.id;
        if (rel.status === 'accepted') {
          followStatus = 'following';
        } else if (rel.status === 'pending') {
          followStatus = rel.senderId === emailKey ? 'sent' : 'received';
        }
      }

      return {
        id: peer.id,
        email: peer.email,
        name: peer.name,
        indexNumber: peer.indexNumber,
        year: peer.year,
        programmeId: peer.programmeId,
        programmeName: peerProgrammeName || 'General Student',
        matchScore,
        matchReasons,
        sharedCourses,
        followStatus,
        friendshipId
      };
    });

    // 5. Sort peers by matchScore descending, then alphabetically by name
    return rankedPeers.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return a.name.localeCompare(b.name);
    });
  }
};
