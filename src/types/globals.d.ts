/// <reference types="jest" />

declare module '@reduxjs/toolkit' {
  export * from '@reduxjs/toolkit/dist/index';
}

declare module '@supabase/supabase-js' {
  export * from '@supabase/supabase-js/dist/main';
}

declare module '@react-native-async-storage/async-storage' {
  export * from '@react-native-async-storage/async-storage/lib/typescript/AsyncStorage';
}

declare module '@react-navigation/native' {
  export * from '@react-navigation/native/lib/typescript/src/index';
}

declare module '@react-navigation/stack' {
  export * from '@react-navigation/stack/lib/typescript/src/index';
}

// React Native module declarations
declare module 'react-native' {
  export * from 'react-native/types';
  interface ViewProps {
    key?: string | number;
  }
}

// Jest globals
declare global {
  var describe: jest.Describe;
  var it: jest.It;
  var expect: jest.Expect;
  var test: jest.It;
  var beforeEach: jest.Lifecycle;
  var afterEach: jest.Lifecycle;
  var beforeAll: jest.Lifecycle;
  var afterAll: jest.Lifecycle;
}
