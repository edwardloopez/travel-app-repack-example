import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { LoadingSpinner } from 'travel-core';

interface PhotoData {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  description: string;
  photographer: string;
  tags: string[];
}

const mockPhotos: PhotoData[] = [
  {
    id: '1',
    title: 'Sunset at Santorini',
    location: 'Santorini, Greece',
    imageUrl: 'https://picsum.photos/400/300?random=1',
    description: 'Beautiful sunset over the iconic blue domes of Santorini',
    photographer: 'Travel Explorer',
    tags: ['sunset', 'greece', 'architecture'],
  },
  {
    id: '2',
    title: 'Northern Lights',
    location: 'Iceland',
    imageUrl: 'https://picsum.photos/400/300?random=2',
    description: 'Aurora Borealis dancing across the Arctic sky',
    photographer: 'Nature Photographer',
    tags: ['aurora', 'iceland', 'night'],
  },
  {
    id: '3',
    title: 'Tokyo Street',
    location: 'Tokyo, Japan',
    imageUrl: 'https://picsum.photos/400/300?random=3',
    description: 'Vibrant neon lights illuminate the bustling streets of Tokyo',
    photographer: 'Urban Explorer',
    tags: ['tokyo', 'urban', 'neon'],
  },
  {
    id: '4',
    title: 'Machu Picchu',
    location: 'Peru',
    imageUrl: 'https://picsum.photos/400/300?random=4',
    description: 'Ancient Incan ruins perched high in the Andes mountains',
    photographer: 'Adventure Seeker',
    tags: ['ruins', 'peru', 'mountains'],
  },
  {
    id: '5',
    title: 'Safari Wildlife',
    location: 'Kenya',
    imageUrl: 'https://picsum.photos/400/300?random=5',
    description: 'Majestic elephants roaming the African savanna',
    photographer: 'Wildlife Photographer',
    tags: ['wildlife', 'kenya', 'safari'],
  },
  {
    id: '6',
    title: 'Venice Canals',
    location: 'Venice, Italy',
    imageUrl: 'https://picsum.photos/400/300?random=6',
    description: 'Gondolas gliding through the romantic canals of Venice',
    photographer: 'Travel Enthusiast',
    tags: ['venice', 'canals', 'gondola'],
  },
];

const { width } = Dimensions.get('window');
const photoWidth = (width - 40) / 2 - 5;

const PhotosScreen: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const filters = [
    'all',
    'sunset',
    'urban',
    'nature',
    'architecture',
    'wildlife',
  ];

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(() => resolve(undefined), 1000));
      setPhotos(mockPhotos);
    } catch (error) {
      console.error('Photos loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPhotos =
    filter === 'all'
      ? photos
      : photos.filter(photo => photo.tags.includes(filter));

  const openPhotoModal = (photo: PhotoData) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
  };

  const closePhotoModal = () => {
    setModalVisible(false);
    setSelectedPhoto(null);
  };

  const renderPhotoItem = ({ item }: { item: PhotoData }) => (
    <TouchableOpacity
      style={styles.photoContainer}
      onPress={() => openPhotoModal(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.photoImage} />
      <View style={styles.photoOverlay}>
        <Text style={styles.photoTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.photoLocation} numberOfLines={1}>
          📍 {item.location}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFilterChip = (filterName: string) => (
    <TouchableOpacity
      key={filterName}
      style={[
        styles.filterChip,
        filter === filterName && styles.filterChipActive,
      ]}
      onPress={() => setFilter(filterName)}
    >
      <Text
        style={[
          styles.filterChipText,
          filter === filterName && styles.filterChipTextActive,
        ]}
      >
        {filterName}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>
          Loading stunning travel photos...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📸 Travel Photos</Text>
        <Text style={styles.subtitle}>
          Discover breathtaking destinations through photography
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map(renderFilterChip)}
      </ScrollView>

      <FlatList
        data={filteredPhotos}
        renderItem={renderPhotoItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.photosGrid}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePhotoModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closePhotoModal}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            {selectedPhoto && (
              <>
                <Image
                  source={{ uri: selectedPhoto.imageUrl }}
                  style={styles.modalImage}
                />
                <View style={styles.modalInfo}>
                  <Text style={styles.modalTitle}>{selectedPhoto.title}</Text>
                  <Text style={styles.modalLocation}>
                    📍 {selectedPhoto.location}
                  </Text>
                  <Text style={styles.modalDescription}>
                    {selectedPhoto.description}
                  </Text>
                  <Text style={styles.modalPhotographer}>
                    📷 By {selectedPhoto.photographer}
                  </Text>
                  <View style={styles.tagsContainer}>
                    {selectedPhoto.tags.map(tag => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Text style={styles.footer}>
        Capture and share your travel memories from around the world
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#7f8c8d',
    lineHeight: 20,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
    flexGrow: 0,
    height: 50,
  },
  filtersContent: {
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#3498db',
  },
  filterChipText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: 'white',
  },
  photosGrid: {
    padding: 20,
    paddingTop: 0,
  },
  row: {
    justifyContent: 'space-between',
  },
  photoContainer: {
    width: photoWidth,
    height: photoWidth * 0.8,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: 'white',
  },
  photoImage: {
    width: '100%',
    height: '70%',
    resizeMode: 'cover',
  },
  photoOverlay: {
    padding: 12,
    height: '30%',
    justifyContent: 'center',
  },
  photoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  photoLocation: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 40,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  modalInfo: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  modalLocation: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 12,
  },
  modalPhotographer: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 10,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#7f8c8d',
  },
  footer: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
    padding: 20,
    fontSize: 12,
  },
});

export default PhotosScreen;
