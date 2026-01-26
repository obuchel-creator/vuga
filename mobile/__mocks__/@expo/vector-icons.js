// __mocks__/@expo/vector-icons.js

import React from 'react';

const createIcon = (name = 'Icon') => {
  const Icon = (props) => React.createElement('Icon', props, null);
  Icon.displayName = name;
  return Icon;
};

export const Ionicons = createIcon('Ionicons');
export const MaterialIcons = createIcon('MaterialIcons');
export const FontAwesome = createIcon('FontAwesome');
export const AntDesign = createIcon('AntDesign');
export const Entypo = createIcon('Entypo');
export const Feather = createIcon('Feather');
export const Fontisto = createIcon('Fontisto');
export const Foundation = createIcon('Foundation');
export const MaterialCommunityIcons = createIcon('MaterialCommunityIcons');
export const Octicons = createIcon('Octicons');
export const SimpleLineIcons = createIcon('SimpleLineIcons');
export const Zocial = createIcon('Zocial');
export default Ionicons;
