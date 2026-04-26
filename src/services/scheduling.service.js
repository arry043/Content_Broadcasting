const { Op } = require('sequelize');
const { Content, ContentSchedule } = require('../models');

exports.getActiveContentForTeacher = async (teacherId, subject = null) => {
  const now = new Date();

  // Step 1: Fetch eligible content
  const whereClause = {
    uploaded_by: teacherId,
    status: 'approved',
    start_time: { [Op.not]: null, [Op.lte]: now },
    end_time: { [Op.not]: null, [Op.gte]: now },
  };

  if (subject) {
    whereClause.subject = subject;
  }

  const contents = await Content.findAll({
    where: whereClause,
    include: [
      {
        model: ContentSchedule,
        required: true,
      },
    ],
  });

  if (!contents || contents.length === 0) {
    return null;
  }

  // Step 3: Group by subject
  const groupedBySubject = {};
  for (const content of contents) {
    if (!groupedBySubject[content.subject]) {
      groupedBySubject[content.subject] = [];
    }
    groupedBySubject[content.subject].push(content);
  }

  const activeContents = [];

  // Step 4 & 5: Rotation Logic
  const nowUnix = Math.floor(now.getTime() / 1000);

  for (const [subj, group] of Object.entries(groupedBySubject)) {
    // Sort by rotation_order ASC
    group.sort((a, b) => a.ContentSchedule.rotation_order - b.ContentSchedule.rotation_order);

    let totalCycleDuration = 0;
    let cycleStartTime = Infinity;

    for (const content of group) {
      const duration = (content.ContentSchedule.duration_minutes || 5) * 60; // in seconds
      totalCycleDuration += duration;
      
      const startUnix = Math.floor(new Date(content.start_time).getTime() / 1000);
      if (startUnix < cycleStartTime) {
        cycleStartTime = startUnix;
      }
    }

    if (totalCycleDuration === 0) continue; // Safety check

    const elapsed = (nowUnix - cycleStartTime) % totalCycleDuration;
    let accumulated = 0;

    for (const content of group) {
      const durationSeconds = (content.ContentSchedule.duration_minutes || 5) * 60;
      accumulated += durationSeconds;

      if (elapsed < accumulated) {
        // This is the active content for this subject
        const baseCyclesCompleted = Math.floor((nowUnix - cycleStartTime) / totalCycleDuration);
        const rotationEndsAtUnix = cycleStartTime + (baseCyclesCompleted * totalCycleDuration) + accumulated;
        
        activeContents.push({
          content,
          rotationEndsAt: new Date(rotationEndsAtUnix * 1000),
        });
        break;
      }
    }
  }

  if (activeContents.length === 0) return null;

  // If a specific subject is requested, return the single active content object
  if (subject) {
    return activeContents[0] || null;
  }

  // If no subject filter, return an array of active content per subject
  return activeContents;
};
