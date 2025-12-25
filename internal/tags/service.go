package tags

import (
	"context"

	"github.com/adimail/asset-manager/ent"
	"github.com/adimail/asset-manager/ent/asset"
	"github.com/adimail/asset-manager/ent/tag"
)

type Service struct {
	client *ent.Client
}

func NewService(client *ent.Client) *Service {
	return &Service{client: client}
}

func (s *Service) Create(ctx context.Context, name, color string) (*ent.Tag, error) {
	return s.client.Tag.Create().
		SetName(name).
		SetColor(color).
		Save(ctx)
}

func (s *Service) List(ctx context.Context) ([]*ent.Tag, error) {
	return s.client.Tag.Query().Order(ent.Asc(tag.FieldName)).All(ctx)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.client.Tag.DeleteOneID(id).Exec(ctx)
}

func (s *Service) TagAsset(ctx context.Context, assetID string, tagIDs []string) error {
	return s.client.Asset.UpdateOneID(assetID).
		ClearTags().
		AddTagIDs(tagIDs...).
		Exec(ctx)
}

func (s *Service) BulkTagAssets(ctx context.Context, assetIDs []string, tagIDs []string) error {
	return s.client.Asset.Update().
		Where(asset.IDIn(assetIDs...)).
		ClearTags().
		AddTagIDs(tagIDs...).
		Exec(ctx)
}

func (s *Service) UntagAsset(ctx context.Context, assetID string, tagID string) error {
	return s.client.Asset.UpdateOneID(assetID).
		RemoveTagIDs(tagID).
		Exec(ctx)
}
