import { Trash2 } from "lucide-react-native";
import React, { useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";

const DELETE_BUTTON_WIDTH = 80;
const SWIPE_THRESHOLD = -DELETE_BUTTON_WIDTH / 2;

type Props = {
  children: React.ReactNode;
  onDelete: () => void;
  disabled?: boolean;
};

export default function SwipeableChatRow({ children, onDelete, disabled }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        // Limita lo swipe solo verso sinistra (valori negativi)
        const { translationX } = event.nativeEvent;
        if (translationX > 0) {
          translateX.setValue(0);
        } else if (translationX < -DELETE_BUTTON_WIDTH) {
          translateX.setValue(-DELETE_BUTTON_WIDTH);
        }
      }
    }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      
      // Se supera la soglia, mostra il pulsante delete, altrimenti torna a 0
      if (translationX < SWIPE_THRESHOLD) {
        Animated.spring(translateX, {
          toValue: -DELETE_BUTTON_WIDTH,
          useNativeDriver: true,
          tension: 100,
          friction: 10
        }).start();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10
        }).start();
      }
    }
  };

  const handleDelete = () => {
    // Animazione di chiusura prima di eliminare
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      onDelete();
    });
  };

  return (
    <View style={styles.container}>
      {/* Pulsante Delete sotto la riga */}
      <View style={styles.deleteButtonContainer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Trash2 size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Contenuto swipeable */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-5, 5]}
        enabled={!disabled}
      >
        <Animated.View
          style={[
            styles.swipeableContent,
            {
              transform: [{ translateX }]
            }
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden"
  },
  deleteButtonContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BUTTON_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ef4444"
  },
  deleteButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  swipeableContent: {
    backgroundColor: "#fff"
  }
});
