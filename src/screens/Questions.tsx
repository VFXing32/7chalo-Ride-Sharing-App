import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';

type RootStackParamList = {
  Menu: undefined;
  FAQ: undefined;
};

type FAQNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FAQ'>;

type FAQItem = {
  question: string;
  answer: string;
};

const FAQScreen = () => {
  const navigation = useNavigation<FAQNavigationProp>();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqData: FAQItem[] = [
    {
      question: "What is 7chalo and how does it work?",
      answer: "7chalo is a ride-sharing platform that connects people from nearby organizations to share rides together. Users can either offer rides as a Captain or join rides as a Passenger, helping to reduce travel costs and environmental impact."
    },
    {
      question: "How do I switch between Captain and Passenger modes?",
      answer: "You can easily switch between Captain and Passenger modes using the toggle switch on your dashboard. As a Captain, you can offer rides, while as a Passenger, you can search for and join available rides."
    },
    {
      question: "How is the ride fare calculated?",
      answer: "Ride fares are calculated based on the distance of the journey and are split fairly among all passengers. The app promotes cost-sharing rather than profit-making, helping everyone save on fuel costs."
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we take your privacy seriously. We only share necessary information with your ride partners and implement strict security measures to protect your personal data."
    },
    {
      question: "What safety measures are in place?",
      answer: "We verify all users through their organizational credentials, track rides in real-time, and have an emergency support system. Users can also rate their ride experience and report any concerns."
    },
    {
      question: "How does the tree planting initiative work?",
      answer: "For every ride shared through 7chalo, we calculate the carbon emissions saved and convert it into virtual trees planted. This helps visualize your positive environmental impact."
    },
    {
      question: "What happens if I need to cancel a ride?",
      answer: "You can cancel a ride up to 30 minutes before the scheduled departure time. We encourage giving advance notice to allow other users to make alternative arrangements."
    },
    {
      question: "How do I earn badges and improve my rating?",
      answer: "Badges and ratings are earned through consistent positive behavior, such as completing rides on time, maintaining good ratings from co-riders, and regular participation in ride sharing."
    }
  ];

  const toggleQuestion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#D3463A" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ & Help</Text>
      </View>

      {/* FAQ List */}
      <ScrollView style={styles.faqContainer}>
        {faqData.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.faqItem,
              expandedIndex === index && styles.faqItemExpanded
            ]}
            onPress={() => toggleQuestion(index)}
            activeOpacity={0.7}
          >
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{item.question}</Text>
              {expandedIndex === index ? (
                <ChevronUp color="#D3463A" size={20} />
              ) : (
                <ChevronDown color="#D3463A" size={20} />
              )}
            </View>
            
            {expandedIndex === index && (
              <Text style={styles.answerText}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Help Contact */}
      <View style={styles.helpSection}>
        <Text style={styles.helpText}>Still need help?</Text>
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    backgroundColor: '#D3463A',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16,
  },
  faqContainer: {
    flex: 1,
    padding: 16,
  },
  faqItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqItemExpanded: {
    backgroundColor: '#FFF',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  answerText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 12,
    lineHeight: 20,
  },
  helpSection: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  helpText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 12,
  },
  contactButton: {
    backgroundColor: '#D3463A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    elevation: 2,
  },
  contactButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FAQScreen;