import { t } from "ttag";

import { CopyTextInput } from "metabase/common/components/CopyTextInput";
import CS from "metabase/css/core/index.css";
import { Button, Flex, Group, Icon, Modal, Stack, Text } from "metabase/ui";
import { getThemeOverrides } from "metabase/ui/theme";
const { fontFamilyMonospace } = getThemeOverrides();

export const SecretKeyModal = ({
  secretKey,
  onClose,
}: {
  secretKey: string;
  onClose: () => void;
}) => (
  <Modal
    size="30rem"
    opened
    onClose={onClose}
    title={t`Copy and save the API key`}
    data-testid="secret-key-modal"
  >
    <Stack gap="xl" data-testid="secret-key-modal">
      <CopyTextInput
        label={t`The API key`}
        size="sm"
        value={secretKey}
        readOnly
        disabled
        styles={{
          input: {
            color: `black`,
            fontFamily: fontFamilyMonospace as string,
          },
        }}
      />
      <Flex direction="row" gap="md">
        <Icon
          name="info_filled"
          size={22}
          className={CS.textMedium}
          style={{ marginTop: "-4px" }}
        />
        <Text
          size="sm"
          color="text-medium"
        >{t`Please copy this key and save it somewhere safe. For security reasons, we can't show it to you again.`}</Text>
      </Flex>
      <Group justify="flex-end">
        <Button onClick={onClose} variant="filled">{t`Done`}</Button>
      </Group>
    </Stack>
  </Modal>
);
