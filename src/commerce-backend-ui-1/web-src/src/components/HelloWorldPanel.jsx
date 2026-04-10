import { Flex, Heading, View } from "@adobe/react-spectrum";

const HEADING_LEVEL = 1;

export default function HelloWorldPanel() {
  return (
    <View padding="size-400">
      <Flex alignItems="center" justifyContent="center">
        <Heading level={HEADING_LEVEL}>Hello World</Heading>
      </Flex>
    </View>
  );
}
