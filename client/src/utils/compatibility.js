/**
 * Calculates a client-side compatibility percentage between two users based on lifestyle preferences.
 * 
 * @param {Object} userPrefs - The logged-in user's preferences object
 * @param {Object} ownerPrefs - The listing owner's preferences object
 * @returns {number} Compatibility percentage (0-100)
 */
export const calculateCompatibility = (userPrefs, ownerPrefs) => {
  if (!userPrefs || !ownerPrefs) return 0;
  
  let score = 0;
  let totalKeys = 0;
  
  const keys = [
    'foodPreference',
    'smokingHabit',
    'alcoholConsumption',
    'cleanlinessLevel',
    'sleepSchedule',
    'workStudyRoutine',
    'guestFrequency',
    'noiseTolerance',
    'sharingExpenses',
    'lifestylePersonality'
  ];
  
  keys.forEach(key => {
    const val1 = userPrefs[key];
    const val2 = ownerPrefs[key];
    
    if (!val1 || !val2) return;
    totalKeys++;
    
    if (val1 === val2) {
      score += 10;
    } else {
      // Partial match checks for nuanced choices
      if (key === 'foodPreference') {
        if (val1 === 'No Preference' || val2 === 'No Preference') {
          score += 8;
        }
      } else if (key === 'smokingHabit') {
        if ((val1 === 'Comfortable with smokers' && val2 === 'Regularly') || 
            (val2 === 'Comfortable with smokers' && val1 === 'Regularly')) {
          score += 8;
        } else if ((val1 === 'No' && val2 === 'Occasionally') || 
                   (val2 === 'No' && val1 === 'Occasionally')) {
          score += 4;
        }
      } else if (key === 'alcoholConsumption') {
        if ((val1 === 'Okay with others drinking' && val2 === 'Regularly') || 
            (val2 === 'Okay with others drinking' && val1 === 'Regularly')) {
          score += 8;
        } else if ((val1 === 'No' && val2 === 'Occasionally') || 
                   (val2 === 'No' && val1 === 'Occasionally')) {
          score += 4;
        }
      } else if (key === 'cleanlinessLevel') {
        if (val1 === 'Moderately Clean' || val2 === 'Moderately Clean') {
          score += 7;
        }
      } else if (key === 'noiseTolerance') {
        if (val1 === 'Moderate noise is fine' || val2 === 'Moderate noise is fine') {
          score += 7;
        }
      } else if (key === 'sleepSchedule') {
        if (val1 === 'Moderate (11 PM – 1 AM)' || val2 === 'Moderate (11 PM – 1 AM)') {
          score += 7;
        }
      } else {
        // Minor base compatibility for other non-conflicting fields
        score += 2;
      }
    }
  });
  
  if (totalKeys === 0) return 50; // Neutral baseline
  return Math.round((score / (totalKeys * 10)) * 100);
};
