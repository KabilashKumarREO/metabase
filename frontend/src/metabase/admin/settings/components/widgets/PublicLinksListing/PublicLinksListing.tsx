import cx from "classnames";
import { useState } from "react";
import { t } from "ttag";

import { ConfirmModal } from "metabase/common/components/ConfirmModal";
import ExternalLink from "metabase/common/components/ExternalLink";
import Link from "metabase/common/components/Link";
import { LoadingAndErrorWrapper } from "metabase/common/components/LoadingAndErrorWrapper";
import AdminS from "metabase/css/admin.module.css";
import CS from "metabase/css/core/index.css";
import { ActionIcon, Icon, Loader } from "metabase/ui";

export const PublicLinksListing = <
  T extends { id: string | number; name: string },
>({
  isLoading,
  data = [],
  revoke,
  getUrl,
  getPublicUrl,
  noLinksMessage,
  "data-testid": dataTestId,
}: {
  data?: T[];
  isLoading?: boolean;
  revoke?: (item: T) => Promise<unknown>;
  getUrl: (item: T) => string;
  getPublicUrl?: (item: T) => string | null;
  noLinksMessage: string;
  "data-testid"?: string;
}) => {
  const [linkToRevoke, setLinkToRevoke] = useState<undefined | T>();
  const handleCloseModal = () => setLinkToRevoke(undefined);

  if (isLoading) {
    return <Loader />;
  }

  if (data.length === 0) {
    return <LoadingAndErrorWrapper error={noLinksMessage} />;
  }

  return (
    <div className={cx(CS.bordered, CS.rounded, CS.full)}>
      <table data-testid={dataTestId} className={AdminS.ContentTable}>
        <thead>
          <tr>
            <th>{t`Name`}</th>
            {getPublicUrl && <th>{t`Public Link`}</th>}
            {revoke && <th>{t`Revoke Link`}</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const internalUrl = getUrl?.(item);
            const publicUrl = getPublicUrl?.(item);

            return (
              <tr key={item.id}>
                <td>
                  {internalUrl ? (
                    <Link to={internalUrl} className={CS.textWrap}>
                      {item.name}
                    </Link>
                  ) : (
                    item.name
                  )}
                </td>
                {publicUrl && (
                  <td>
                    <ExternalLink
                      href={publicUrl}
                      className={cx(CS.link, CS.textWrap)}
                    >
                      {publicUrl}
                    </ExternalLink>
                  </td>
                )}
                {revoke && (
                  <td className={cx(CS.flex, CS.layoutCentered)}>
                    <ActionIcon
                      aria-label={t`Revoke link`}
                      onClick={() => setLinkToRevoke(item)}
                    >
                      <Icon name="close" />
                    </ActionIcon>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <ConfirmModal
          opened={Boolean(linkToRevoke)}
          title={t`Disable this link?`}
          content={t`They won't work anymore, and can't be restored, but you can create new links.`}
          onClose={handleCloseModal}
          onConfirm={async () => {
            if (revoke && linkToRevoke) {
              await revoke(linkToRevoke);
              handleCloseModal();
            }
          }}
        />
      </table>
    </div>
  );
};
