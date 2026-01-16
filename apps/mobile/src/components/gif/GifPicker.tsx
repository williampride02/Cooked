import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { haptics } from '@/utils/haptics';
import {
  searchGifs,
  getTrendingGifs,
  getPreviewUrl,
  getGifUrl,
  registerShare,
  type TenorGif,
} from '@/lib/tenor';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 2;
const GIF_GAP = 4;
const GIF_WIDTH = (SCREEN_WIDTH - 32 - GIF_GAP) / NUM_COLUMNS;

interface GifPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (gifUrl: string) => void;
}

export function GifPicker({ visible, onClose, onSelect }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextPos, setNextPos] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef<string>('');

  // Load trending GIFs when picker opens
  useEffect(() => {
    if (visible && gifs.length === 0) {
      loadTrending();
    }
  }, [visible]);

  // Reset state when closing
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setHasSearched(false);
      lastQueryRef.current = '';
    }
  }, [visible]);

  const loadTrending = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getTrendingGifs(20);
      setGifs(result.gifs);
      setNextPos(result.next);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (query: string, append: boolean = false) => {
    if (!query.trim()) {
      // If search is cleared, load trending
      loadTrending();
      setHasSearched(false);
      lastQueryRef.current = '';
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    lastQueryRef.current = query;

    try {
      const result = await searchGifs(query, 20, append ? nextPos || undefined : undefined);
      if (append) {
        setGifs((prev) => [...prev, ...result.gifs]);
      } else {
        setGifs(result.gifs);
      }
      setNextPos(result.next);
    } finally {
      setIsLoading(false);
    }
  }, [nextPos, loadTrending]);

  // Debounced search
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    // Clear any pending search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search by 400ms
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(text);
    }, 400);
  }, [handleSearch]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && nextPos) {
      if (hasSearched && lastQueryRef.current) {
        handleSearch(lastQueryRef.current, true);
      } else {
        // Load more trending
        setIsLoading(true);
        getTrendingGifs(20, nextPos).then((result) => {
          setGifs((prev) => [...prev, ...result.gifs]);
          setNextPos(result.next);
          setIsLoading(false);
        });
      }
    }
  }, [isLoading, nextPos, hasSearched, handleSearch]);

  const handleSelectGif = useCallback((gif: TenorGif) => {
    haptics.selection();

    // Get the full-quality URL for sending
    const gifUrl = getGifUrl(gif, 'medium');

    // Register the share with Tenor (for their analytics)
    registerShare(gif.id, lastQueryRef.current || undefined);

    onSelect(gifUrl);
    onClose();
  }, [onSelect, onClose]);

  const handleClearSearch = useCallback(() => {
    haptics.light();
    handleSearchChange('');
  }, [handleSearchChange]);

  const handleClose = useCallback(() => {
    // Clear search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    onClose();
  }, [onClose]);

  const renderGifItem = useCallback(({ item }: { item: TenorGif }) => {
    const previewUrl = getPreviewUrl(item);

    return (
      <Pressable
        onPress={() => handleSelectGif(item)}
        className="mb-1"
        style={{ width: GIF_WIDTH }}
        accessibilityLabel={item.content_description || 'GIF'}
        accessibilityRole="button"
      >
        <Image
          source={{ uri: previewUrl }}
          style={{ width: GIF_WIDTH, height: GIF_WIDTH * 0.75 }}
          className="rounded-sm bg-surface"
          resizeMode="cover"
        />
      </Pressable>
    );
  }, [handleSelectGif]);

  const renderFooter = useCallback(() => {
    if (!isLoading) return null;

    return (
      <View className="py-m items-center">
        <ActivityIndicator size="small" color="rgb(255, 77, 0)" />
      </View>
    );
  }, [isLoading]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    return (
      <View className="flex-1 items-center justify-center py-xl">
        <Text className="text-text-muted text-body">
          {hasSearched ? 'No GIFs found' : 'Search for GIFs'}
        </Text>
      </View>
    );
  }, [isLoading, hasSearched]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Backdrop */}
        <Pressable
          onPress={handleClose}
          className="flex-1 bg-black/50"
          accessibilityLabel="Close GIF picker"
        />

        {/* Bottom Sheet */}
        <View className="bg-surface-elevated rounded-t-lg h-[70%]">
          {/* Handle */}
          <View className="items-center py-s">
            <View className="w-9 h-1 bg-text-muted rounded-full" />
          </View>

          {/* Header */}
          <View className="px-m pb-m">
            <Text className="text-h2 text-text-primary text-center mb-m">
              Search GIFs
            </Text>

            {/* Search Input */}
            <View className="bg-surface rounded-md border border-border px-m py-3 flex-row items-center">
              <Text className="text-text-muted mr-s">{'\u{1F50D}'}</Text>
              <TextInput
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search Tenor..."
                placeholderTextColor="#666666"
                className="flex-1 text-body text-text-primary"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search GIFs"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={handleClearSearch}
                  className="ml-s"
                  accessibilityLabel="Clear search"
                >
                  <Text className="text-text-muted">{'\u2715'}</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Category Label */}
          <View className="px-m pb-s">
            <Text className="text-caption text-text-muted">
              {hasSearched && lastQueryRef.current
                ? `Results for "${lastQueryRef.current}"`
                : 'Trending'}
            </Text>
          </View>

          {/* GIF Grid */}
          <FlatList
            data={gifs}
            keyExtractor={(item) => item.id}
            renderItem={renderGifItem}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={{
              paddingHorizontal: 16,
              gap: GIF_GAP,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
          />

          {/* Tenor Attribution */}
          <View className="px-m py-s border-t border-border">
            <Text className="text-caption text-text-muted text-center">
              Powered by Tenor
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default GifPicker;
