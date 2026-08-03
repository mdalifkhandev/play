import * as React from "react"
import Svg, { Path, G, Defs, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeBlend, FeMorphology } from "react-native-svg"

export const SearchIcon = (props: any) => (
  <Svg width="28" height="28" viewBox="0 0 28 28" fill="none" {...props}>
    <G filter="url(#filter0_dd_54964_4273)">
      <Path d="M12.75 20.75C17.7206 20.75 21.75 16.7206 21.75 11.75C21.75 6.77944 17.7206 2.75 12.75 2.75C7.77944 2.75 3.75 6.77944 3.75 11.75C3.75 16.7206 7.77944 20.75 12.75 20.75Z" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M20.6804 21.4398C21.2104 23.0398 22.4204 23.1998 23.3504 21.7998C24.2004 20.5198 23.6404 19.4698 22.1004 19.4698C20.9604 19.4598 20.3204 20.3498 20.6804 21.4398Z" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </G>
  </Svg>
)
