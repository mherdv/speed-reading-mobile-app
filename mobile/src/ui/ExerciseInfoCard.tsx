import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ExerciseInfo } from '../data/exerciseDescriptions';
import { colors, gameColors } from '../theme/colors';
import { DifficultyStars } from './DifficultyStars';
import { BackButton } from './BackButton';

type Props = {
  info: ExerciseInfo;
  onStart: () => void;
  onBack: () => void;
  bestScore?: number;
};

// Map game IDs to icons
const GAME_ICONS: Record<string, string> = {
  PowerReader: '📖',
  FlashReading: '⚡',
  ComprehensionTest: '📝',
  SchulteNumbers: '🔢',
  SchulteLetters: '🔤',
  SchulteMix: '#️⃣',
  EyeMovementTraining: '👁️',
  VisualSpanExpansion: '🎯',
  PatternScanning: '🔍',
  TimedWordRecognition: '⏱️',
  TimedPhraseRecognition: '📄',
  WordPairs: '🔗',
  TextSearch: '🔎',
  WordSearchGame: '📑',
  NumberSearch: '🔢',
  LetterRecognition: '🅰️',
  NumberRecognition: '🔟',
  SymbolRecognition: '✨',
  MemoryRecall: '🧠',
  LetterJumble: '🔀',
  WordMismatchGrid: '❌',
  EvenNumbers: '2️⃣',
};

export function ExerciseInfoCard({ info, onStart, onBack, bestScore }: Props) {
  const iconBgColor = gameColors[info.id] || colors.primary;
  const iconText = GAME_ICONS[info.id] || '📖';
  
  // Convert difficulty string to level number
  const difficultyLevel = info.difficulty === 'Easy' ? 2 : info.difficulty === 'Medium' ? 3 : 4;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Icon Header */}
        <View style={styles.iconHeader}>
          <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
            <Text style={styles.iconText}>{iconText}</Text>
          </View>
        </View>

        <Text style={styles.title}>{info.name}</Text>
        <Text style={styles.description}>{info.description}</Text>
        
        {/* Difficulty */}
        <View style={styles.difficultyRow}>
          <Text style={styles.difficultyLabel}>Difficulty:</Text>
          <DifficultyStars level={difficultyLevel} size="medium" orientation="horizontal" />
        </View>
        
        {/* Start Button */}
        <Pressable style={styles.startButton} onPress={onStart}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startGradient}
          >
            <Text style={styles.startButtonText}>Start Training</Text>
          </LinearGradient>
        </Pressable>
        
        {/* Best Score */}
        {bestScore !== undefined && (
          <View style={styles.bestScoreRow}>
            <Text style={styles.trophyIcon}>🏆</Text>
            <Text style={styles.bestScoreText}>Previous Best Score: {bestScore} pts.</Text>
          </View>
        )}
        
        {/* Benefits Section */}
        <Text style={styles.sectionTitle}>Benefits</Text>
        <View style={styles.benefitsList}>
          {info.benefits.map((benefit, idx) => (
            <View key={idx} style={styles.benefitItem}>
              <Text style={styles.benefitBullet}>✓</Text>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
        
        {/* Skills Section */}
        <Text style={styles.sectionTitle}>Skills Trained</Text>
        <View style={styles.skillsRow}>
          {info.skills.map((skill, idx) => (
            <View key={idx} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.backButtonContainer}>
        <BackButton onPress={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  scroll: {
    flex: 1,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  difficultyLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  bestScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  trophyIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  bestScoreText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 10,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitBullet: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 14,
    marginRight: 8,
    marginTop: 1,
  },
  benefitText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: colors.primaryLight + '30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  backButtonContainer: {
    alignItems: 'flex-start',
    marginTop: 16,
  },
});
