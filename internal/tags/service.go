package tags

import (
	"context"

	"github.com/adimail/asset-manager/ent"
	"github.com/adimail/asset-manager/ent/asset"
	"github.com/adimail/asset-manager/ent/tag"
)

type AssetDeleter interface {
	DeleteMultiple(ctx context.Context, ids []string) error
}

type Service struct {
	client       *ent.Client
	assetDeleter AssetDeleter
}

func NewService(client *ent.Client, assetDeleter AssetDeleter) *Service {
	return &Service{
		client:       client,
		assetDeleter: assetDeleter,
	}
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

func (s *Service) Update(ctx context.Context, id, name, color string) (*ent.Tag, error) {
	return s.client.Tag.UpdateOneID(id).
		SetName(name).
		SetColor(color).
		Save(ctx)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	// Find all assets associated with this tag
	assets, err := s.client.Tag.Query().Where(tag.ID(id)).QueryAssets().All(ctx)
	if err != nil {
		return err
	}

	// Collect IDs
	assetIDs := make([]string, len(assets))
	for i, a := range assets {
		assetIDs[i] = a.ID
	}

	// Delete assets if any exist
	if len(assetIDs) > 0 {
		if err := s.assetDeleter.DeleteMultiple(ctx, assetIDs); err != nil {
			return err
		}
	}

	// Finally delete the tag
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
