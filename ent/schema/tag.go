package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

type Tag struct {
	ent.Schema
}

func (Tag) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(uuid.NewString),
		field.String("name").Unique().NotEmpty(),
		field.String("color").Default("#3B82F6"),
		field.Time("created_at").Default(time.Now),
	}
}

func (Tag) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("assets", Asset.Type).Ref("tags"),
	}
}
